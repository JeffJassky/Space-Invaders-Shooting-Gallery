#include <i2c_t3.h>

/****************************************************************
 * Fat Cat Hot Shot target driver code
 * Written by Zack Freedman of Voidstar Lab for Maker Faire 2016
 * 
 * Materials: 
 *  - Teensy 3.1 or 3.2
 *  - Perfboard, 470kΩ resistors, male three-row headers
 *  - Adafruit PWM servo driver board
 *  - Enclosure, panel-mount barrel socket, USB cable
 *  
 * Hardware prep:
 *  - Desolder the capacitor, right-angle header, and screw terminals from PWM driver
 *  - Replace the capacitor on the bottom side of the PWM driver
 *  - Hardwire the PWM driver to the Teensy:
 *    - OE: 12
 *    - SCL: 29
 *    - SDA: 30
 *    - GND: GND
 *    - VCC: 3V3
 *    - V+: DO NOT CONNECT! NOT EVEN TO VIN!
 *    - Solder wires to the barrel socket where the screw terminals used to be
 *  - Build the sensor frontend:     
 *    - One pin of each piezo should go to an analog pin and be pulled down to AGND
 *    - The other piezo pin should connect to AGND
 *    - Use AGND and not GND
 *    - Hardwire sensor pins to A0 to A15
 *    - Hardwire AGND
 *  - Connect a USB cable to the Teensy and mount everything in an enclosure
 *  - Make one unit with IDENTIFIER 1 and another with IDENTIFIER 2
 *  
 * System intended for use with HS311 servos with V+ = 6V
 */
// Contains code from Adafruit PWM Servo Driver. License is included after code.

// Options are 1 and 2
#define IDENTIFIER 2

#define _i2caddr 0x40

#define PCA9685_SUBADR1 0x2
#define PCA9685_SUBADR2 0x3
#define PCA9685_SUBADR3 0x4

#define PCA9685_MODE1 0x0
#define PCA9685_PRESCALE 0xFE

#define LED0_ON_L 0x6
#define LED0_ON_H 0x7
#define LED0_OFF_L 0x8
#define LED0_OFF_H 0x9

#define ALLLED_ON_L 0xFA
#define ALLLED_ON_H 0xFB
#define ALLLED_OFF_L 0xFC
#define ALLLED_OFF_H 0xFD

// For Adafruit's servo driver code
#define ENABLE_DEBUG_OUTPUT false

// Set using trial and error
#define DOWN_POSITION 500
#define UP_POSITION 315

// Value selected for 470kΩ pulldown
#define THRESHOLD 400
bool targetStatus[16]; // A target is up and polled if and only if its status byte is set
const int targetSensorPin[] = {A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15};

// Modify these manually to make targets line up
// TODO: Add ability to configure these on the device
const int trim[16][2] = {
  {0, 45}, // 0
  { -3, 45}, // 1
  { -10, 30}, // 2
  {7, 47}, // 3
  {5, 45}, // 4
  {25, 15}, // 5
  { -15, 25}, // 6
  {0, 15}, // 7
  {10, 40}, // 8
  {25, 50}, // 9
  {20, 60}, // 10
  {2, 45}, // 11
  {3, 0}, // 12
  { -10, 0}, // 13
  { -10, 0}, // 14
  {0, 0} // 15
};

#define COMMAND_ACK 'A'
#define COMMAND_ENABLE_TARGET 'B'
#define COMMAND_CLEAR_TARGETS 'C'
#define HEADER_TARGET_DOWN 'H'

// Command buffer is made variable for forward compatibility
#define COMMAND_BUFFER_LENGTH 3
int commandBuffer[COMMAND_BUFFER_LENGTH];
byte commandBufferPointer;

void setup() {
  // Because 0x00 is a legal command byte, I use -1 as null
  for (int i = 0; i < COMMAND_BUFFER_LENGTH; i++) commandBuffer[i] = -1;

  Serial.begin(9600);
  delay(2000); // Delay to stabilize Teensy USB serial init

  // I2C0 and its alternate pins overlaps with analog inputs, so we use I2C1
  Wire1.begin(I2C_MASTER, 0x00, I2C_PINS_29_30, I2C_PULLUP_INT, I2C_RATE_400);

  resetPWMDriver();
  setPWMFreq(60); // HC311 servos are driven at 60Hz

  // Initialize targets into known position
  for (byte i = 0; i < 16; i++) setTarget(i, false, true);

  // Enable servo driver
  pinMode(12, OUTPUT);
  digitalWrite(12, LOW);

  for (byte i = 0; i < 16; i++) {
    setTarget(i, true); // Targets start raised for testing. Mainboard should clear them first.
    if (i != 15) delay(100); // Reduce load on PSU and wires by staggering raising targets
  }
}

void loop() {
  // Parse incoming serial data. This is a trivial parser implementation
  int incoming = Serial.read();
  if (incoming == '\r') { // CR EOL is delimiter. This implementation should tolerate a CR LF EOL as well.
    int selectedTarget = 0;
    switch (commandBuffer[0]) {
      case COMMAND_ACK: // ACK (acknowledge/whoami) command lets motherboard tell which controller is which
        // Command: "A\r"
        // Response: "ID" ['1'/'2'] '\r' '\n'
        Serial.print("ID");
        Serial.println(IDENTIFIER);
        break;
      case COMMAND_CLEAR_TARGETS: // Forces all targets to fall.
        // Command: "C\r"
        // Response: "OK\r\n"
        for (int i = 0; i < 16; i++) setTarget(i, false);
        Serial.println("OK");
        break;
      case COMMAND_ENABLE_TARGET: // The selected target is raised and will be polled.
        // Command: 'B' ['0'-"15"] '\r'
        // Response: "OK\r\n" if successful
        //           "ERR\r\n" if selected target is not between 0 and 15 inclusive
        if (commandBuffer[2] != -1) { // We got a two-digit number
          selectedTarget += commandBuffer[2] - '0';
          selectedTarget += (commandBuffer[1] - '0') * 10;
        } // One-digit number
        else selectedTarget = commandBuffer[1] - '0';

        if (selectedTarget >= 0 && selectedTarget <= 15) {
          setTarget(selectedTarget, true);
          Serial.println("OK");
        }
        else Serial.println("ERR1"); // An invalid target identifier was sent.
        break;
      default:
        Serial.print(commandBuffer[0]);
        Serial.println("ERR2"); // An invalid command byte was sent
    }

    // Command is complete, clear the buffer
    for (int i = 0; i < COMMAND_BUFFER_LENGTH; i++) commandBuffer[i] = -1;
    commandBufferPointer = 0;
  }
  else if (incoming != -1) { // -1 indicates no data
    if (commandBufferPointer < COMMAND_BUFFER_LENGTH) { // If there's room, buffer the byte.
      commandBuffer[commandBufferPointer] = incoming;
      commandBufferPointer++;
    }
    else { // If buffer is full, pop zeroth byte and push incoming byte into last position
      for (int i = 0; i < COMMAND_BUFFER_LENGTH - 1; i++) commandBuffer[i] = commandBuffer[i + 1];
      commandBuffer[COMMAND_BUFFER_LENGTH - 1] = incoming;
    }
  }

  for (int i = 0; i < 16; i++) {
    // Through the magic of short circuiting, only enabled targets are polled.
    // With few targets active, responsiveness should be ridiculously good.
    if (targetStatus[i] && analogRead(targetSensorPin[i]) > THRESHOLD) {
      setTarget(i, false);
      // Hit event packet: [Header][Target ID][Sensor reading as byte][EOL]
      Serial.print(HEADER_TARGET_DOWN);
      Serial.print(i);
      Serial.print(',');
      Serial.print(analogRead(targetSensorPin[i]));
      Serial.println();
    }
  }
}

void setTarget(byte target, bool state, bool force) {
  // If target is already in that state, don't waste time sending I2C data
  if (!force && targetStatus[target] == state) return;

  // Servo trim is constant, so modifier affects both states
  if (state) setPWM(target, 0, UP_POSITION + trim[target][IDENTIFIER - 1]);
  else setPWM(target, 0, DOWN_POSITION + trim[target][IDENTIFIER - 1]);

  targetStatus[target] = state;
}

// Overload for circumstances where you don't need to force the targets
void setTarget(byte target, bool state) {
  setTarget(target, state, false);
}

// Remainder of code is from Adafruit sample

void resetPWMDriver() {
  write8(PCA9685_MODE1, 0x0);
}

void setPWMFreq(float freq) {
  //Serial.print("Attempting to set freq ");
  //Serial.println(freq);
  freq *= 0.9;  // Correct for overshoot in the frequency setting (see issue #11).
  float prescaleval = 25000000;
  prescaleval /= 4096;
  prescaleval /= freq;
  prescaleval -= 1;
  if (ENABLE_DEBUG_OUTPUT) {
    Serial.print("Estimated pre-scale: "); Serial.println(prescaleval);
  }
  uint8_t prescale = floor(prescaleval + 0.5);
  if (ENABLE_DEBUG_OUTPUT) {
    Serial.print("Final pre-scale: "); Serial.println(prescale);
  }

  uint8_t oldmode = read8(PCA9685_MODE1);
  uint8_t newmode = (oldmode & 0x7F) | 0x10; // sleep
  write8(PCA9685_MODE1, newmode); // go to sleep
  write8(PCA9685_PRESCALE, prescale); // set the prescaler
  write8(PCA9685_MODE1, oldmode);
  delay(5);
  write8(PCA9685_MODE1, oldmode | 0xa1);  //  This sets the MODE1 register to turn on auto increment.
  // This is why the beginTransmission below was not working.
  //  Serial.print("Mode now 0x"); Serial.println(read8(PCA9685_MODE1), HEX);
}

void setPWM(uint8_t num, uint16_t on, uint16_t off) {
  //  Serial.print("Setting PWM "); Serial.print(num); Serial.print(": "); Serial.print(on); Serial.print("->"); Serial.println(off);

  Wire1.beginTransmission(_i2caddr);
  Wire1.write(LED0_ON_L + 4 * num);
  Wire1.write(on);
  Wire1.write(on >> 8);
  Wire1.write(off);
  Wire1.write(off >> 8);
  Wire1.endTransmission();
}

// Sets pin without having to deal with on/off tick placement and properly handles
// a zero value as completely off.  Optional invert parameter supports inverting
// the pulse for sinking to ground.  Val should be a value from 0 to 4095 inclusive.
void setPin(uint8_t num, uint16_t val, bool invert)
{
  // Clamp value between 0 and 4095 inclusive.
  val = min(val, 4095);
  if (invert) {
    if (val == 0) {
      // Special value for signal fully on.
      setPWM(num, 4096, 0);
    }
    else if (val == 4095) {
      // Special value for signal fully off.
      setPWM(num, 0, 4096);
    }
    else {
      setPWM(num, 0, 4095 - val);
    }
  }
  else {
    if (val == 4095) {
      // Special value for signal fully on.
      setPWM(num, 4096, 0);
    }
    else if (val == 0) {
      // Special value for signal fully off.
      setPWM(num, 0, 4096);
    }
    else {
      setPWM(num, 0, val);
    }
  }
}

uint8_t read8(uint8_t addr) {
  Wire1.beginTransmission(_i2caddr);
  Wire1.write(addr);
  Wire1.endTransmission();

  Wire1.requestFrom((uint8_t)_i2caddr, (uint8_t)1);
  return Wire1.read();
}

void write8(uint8_t addr, uint8_t d) {
  Wire1.beginTransmission(_i2caddr);
  Wire1.write(addr);
  Wire1.write(d);
  Wire1.endTransmission();
}

/***************************************************
  This is a library for our Adafruit 16-channel PWM & Servo driver

  Pick one up today in the adafruit shop!
  ------> http://www.adafruit.com/products/815

  These displays use I2C to communicate, 2 pins are required to
  interface. For Arduino UNOs, thats SCL -> Analog 5, SDA -> Analog 4

  Adafruit invests time and resources providing this open source code,
  please support Adafruit and open-source hardware by purchasing
  products from Adafruit!

  Written by Limor Fried/Ladyada for Adafruit Industries.
  BSD license, all text above must be included in any redistribution
 ****************************************************/
