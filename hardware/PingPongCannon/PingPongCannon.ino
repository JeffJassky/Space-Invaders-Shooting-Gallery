/*****************************************************************
 * Fat Cat Hot Shot ping pong ball blaster code
 * Written by Charles Reiser and Zack Freedman for Maker Faire 2016
 * 
 * Hardware configuration:
 *  - Adafruit motor shield
 *  - Bipolar motor on M1 and M2
 *  - Relay (vacuum control) on M3
 *  - DC motor (hopper agitator) on M4
 *  - SPST buttons on pins 6 and 7
 * 
 * Includes code from Adafruit Motor Shield example and library
 * ---->	http://www.adafruit.com/products/1438
*/


#include <Wire.h>
#include <Adafruit_MotorShield.h>
#include "utility/Adafruit_MS_PWMServoDriver.h"

#define LEFT_BUTTON 6
#define RIGHT_BUTTON 7
bool leftButtonWasPressed;
bool rightButtonWasPressed;

// Create the motor shield object with the default I2C address
Adafruit_MotorShield AFMS = Adafruit_MotorShield();
// Or, create it with a different I2C address (say for stacking)
// Adafruit_MotorShield AFMS = Adafruit_MotorShield(0x61);

// Connect a stepper motor with 200 steps per revolution (1.8 degree)
// to motor port #1 (M1 and M2)
Adafruit_StepperMotor *feederSprocket = AFMS.getStepper(200, 1);
Adafruit_DCMotor *vacuum = AFMS.getMotor(3);
Adafruit_DCMotor *hopper = AFMS.getMotor(4);

#define FIRE_TIME 300
#define SHOT_COOLDOWN 500
#define SPOOL_TIME 1000
#define SPOOL_STOP_TIME 50
#define ANTI_DRIBBLE_LOCK_TIME 5000
unsigned long lastShotStartTime;
unsigned long spoolStartTime;
unsigned long spoolStopTime;

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Stepper test!");
  //configure pin7 as an input and enable the internal pull-up resistor
  pinMode(RIGHT_BUTTON, INPUT_PULLUP);
  pinMode(LEFT_BUTTON, INPUT_PULLUP);
  pinMode(13, OUTPUT);

  AFMS.begin();  // create with the default frequency 1.6KHz
  //AFMS.begin(1000);  // OR with a different frequency, say 1KHz

  feederSprocket->setSpeed(120);  // 10 rpm
  hopper->setSpeed(255); // Run continuously
  hopper->run(FORWARD);
  vacuum->setSpeed(255); // Don't PWM a relay
}

void loop() {
  // Poll pushbuttons
  bool leftButtonPressed = !digitalRead(LEFT_BUTTON);
  bool rightButtonPressed = !digitalRead(RIGHT_BUTTON);

  if (leftButtonPressed) {
    if (leftButtonWasPressed) {
      // Debugging - print when blaster is ready to fire
      if (millis() - spoolStartTime > SPOOL_TIME) Serial.println("Spooled up");
    }
    else if (millis() - spoolStopTime > SPOOL_STOP_TIME) {
      // Left button has just been pressed. Send debugging info once.
      spoolStartTime = millis();
      Serial.println("Starting to spool up");
      Serial.println("Vacuum on");

      // This code locks the feeder sprocket, to hold balls until ready to fire
      vacuum->run(BACKWARD);
      feederSprocket->step(1, BACKWARD, DOUBLE); // Should also smooth out misalignment over time
    }
  }
  else {
    if (leftButtonWasPressed) {
      // Left button was just released.
      spoolStopTime = millis(); // Debounce releasing, because spool time is significant
      Serial.println("Starting unspool");
    }

    if (millis() - spoolStopTime > SPOOL_STOP_TIME) {
      if (millis() - lastShotStartTime > FIRE_TIME) {
        // If left button has been released long enough, turn vacuum off.
        vacuum->run(RELEASE);
        Serial.println("Vacuum off");
      }
      else {
        // Vacuum won't shut off until current shot finishes firing.
        Serial.println("Finishing shot");
      }
    }

    if (millis() - spoolStopTime > ANTI_DRIBBLE_LOCK_TIME) {
      // After vacuum is fully off and airflow has stopped, power down feeder sprocket.
      // This prevents heat buildup during downtime.
      feederSprocket->release();
    }
  }

  if (rightButtonPressed) {
    if (millis() - spoolStartTime < SPOOL_TIME) Serial.println("Can't fire - not spooled");
    else {
      if (leftButtonPressed && millis() - lastShotStartTime > SHOT_COOLDOWN) {
        // Artificially delay subsequent shots to prevent jams
        Serial.println("Firing");
        digitalWrite(13, HIGH);
        feederSprocket->step(25, FORWARD, DOUBLE);
        lastShotStartTime = millis();
      }
      else {
        // Blaster can't fire until cooldown time has elapsed
        Serial.println("Cooling down");
      }
    }
  }

  if (millis() - lastShotStartTime > FIRE_TIME) {
    // Shot is fired
    digitalWrite(13, LOW);
  }

  // Store button states for edge detection during next iteration
  leftButtonWasPressed = leftButtonPressed;
  rightButtonWasPressed = rightButtonPressed;
}
