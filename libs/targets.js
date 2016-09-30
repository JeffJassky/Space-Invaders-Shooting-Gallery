const SerialPort = require('serialport');

const port1ID = 'usb-Teensyduino_USB_Serial_533680-if00';
const port2ID = 'usb-Teensyduino_USB_Serial_532580-if00';

const targets = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27];

const events = {
	'start': 'start',
	'H': 'strike',
	'ID': 'identifier',
	'wave': 'wave',
	'clear': 'clear'
};

var port1,
port2;

SerialPort.list(function (err, ports) {
	var port1Found = false;
	var port2Found = false;
	ports.forEach(function(port) {
		if(port.pnpId === port1ID){
			port1Found = true;
			connectPort1(port.comName);
		}else if(port.pnpId === port2ID){
                        port2Found = true;
                        connectPort2(port.comName);
                }
		//console.log(port.comName);
		//console.log(port.pnpId);
		//console.log(port.manufacturer);
	});
	if(!port1Found){
		console.log("TARGETS: Port 1 not connected");
	}
	if(!port2Found){
		console.log("TARGETS: Port 2 not connected");
	}
});

function connectPort1(portName){
	// Targets #1
	port1 = new SerialPort(portName,{parser: SerialPort.parsers.readline('\r\n')}).on('open',onPortOpen).on('data', onPortData);
}
function connectPort2(portName){
        // Targets #1
        port2 = new SerialPort(portName,{parser: SerialPort.parsers.readline('\r\n')}).on('open',onPortOpen).on('data', onPortData);
}

function onPortOpen(err){
	if(err){
		return console.log('could not find targets arduino');
	}else{
		console.log('Targets connected');
	}
}

function onPortData(data){
	var commandFound = false;
	for(var key in events){
		if(data.indexOf(key) !== -1){
			process.emit(events[key], data);
			console.log('TARGET COMMAND', data);
			commandFound = true;
		}
	}
	if(!commandFound){
		console.log('DEBUG DATA', data);
	}
}

function clearAll(){
	sendCommand(1, "C");
	sendCommand(2, "C");
}

function setupRandomTargets(info){
	var allTargets = JSON.parse(JSON.stringify(targets))
	shuffle(allTargets);
	var randomTargets = allTargets.slice(0, info.count);
	for(var x=0; x<=randomTargets.length-1; x++){
		putUpTarget(randomTargets[x]);
	}
	console.log('TARGETS GOING UP:' + info.count);
}

function putUpTarget(targetNumber){
	var port = targetNumber <= 15 ? 1 : 2;
	var targetCode = port === 1 ? targetNumber : targetNumber - 16;
	sendCommand(port, 'B'+targetCode);
}

function sendCommand(port, command){
	console.log("WRITING TO PORT " + port, command);
	if(port === 1 && port1){
		port1.write(command + "\r");
	}else if(port === 2 && port2){
		port2.write(command + "\r");
	}
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

process.on('command:targets:clear', function(user){
	clearAll();
});

// GAMEPLAY PORTION
var gameplaySequence = {
	0: { function: clearAll },
	2: { function: setupRandomTargets, argument: {count: 6} },
	8: { function: clearAll },
	10:{ function: setupRandomTargets, argument: {count: 6} },
	19:{ function: clearAll },
	20:{ function: setupRandomTargets, argument: {count: 8} },
	29:{ function: clearAll },
	30:{ function: setupRandomTargets, argument: {count: 8} },
	39:{ function: clearAll },
	40:{ function: setupRandomTargets, argument: {count: 10} },
	49:{ function: clearAll },
	50:{ function: setupRandomTargets, argument: {count: 10} },
	59:{ function: clearAll },
	60:{ function: setupRandomTargets, argument: {count: 10} },
	70:{ function: clearAll },
	77:{ function: setupRandomTargets, argument: {count: 28}},
	85:{ function: clearAll },
	86:{ function: setupRandomTargets, argument: {count:1}},
        87:{ function: clearAll },
        88:{ function: setupRandomTargets, argument: {count:1}},
        89:{ function: clearAll },
        90:{ function: setupRandomTargets, argument: {count:1}},
        91:{ function: clearAll },
        92:{ function: setupRandomTargets, argument: {count:1}},
        93:{ function: clearAll },
        94:{ function: setupRandomTargets, argument: {count:1}},
        95:{ function: clearAll },
        96:{ function: setupRandomTargets, argument: {count:1}},
        97:{ function: clearAll },
        98:{ function: setupRandomTargets, argument: {count:1}},
        99:{ function: clearAll },
        100:{ function: setupRandomTargets, argument: {count:1}},
        101:{ function: clearAll },
        102:{ function: setupRandomTargets, argument: {count:1}},
        103:{ function: clearAll },
        104:{ function: setupRandomTargets, argument: {count:1}},
        105:{ function: clearAll },
        106:{ function: setupRandomTargets, argument: {count:1}},
        107:{ function: clearAll },

        108:{ function: setupRandomTargets, argument: {count:28}},
	120:{ function: clearAll }
};

process.on('time:update', function(time){
	if(gameplaySequence[time] && gameplaySequence[time].function){
		var arg = gameplaySequence[time].argument;
		arg = arg ? arg : null;
		gameplaySequence[time].function(arg);
	}
});
