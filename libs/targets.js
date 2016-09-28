const SerialPort = require('serialport');

const targets = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
const events = {
	'start': 'start',
	'H': 'strike',
	'ID': 'identifier',
	'wave': 'wave',
	'clear': 'clear'
};

// Targets #1
var port1 = new SerialPort('/dev/cu.usbmodem533681',{parser: SerialPort.parsers.readline('\r\n')}).on('open',onPortOpen).on('data', onPortData);

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
	sendCommand('C');
}

function setupRandomTargets(){
	var allTargets = JSON.parse(JSON.stringify(targets))
	shuffle(allTargets);
	var randomTargets = allTargets.slice(0,10);
	for(var x=0; x<=randomTargets.length-1; x++){
		putUpTarget(randomTargets[x]);
	}
}

function putUpTarget(targetNumber){
	sendCommand('B'+targetNumber);
}

function getId(){
	sendCommand('A');
}

function sendCommand(command){
	port1.write(command + "\r");
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

// WHEN THE "userstart" HAPPENS
process.on('userstart', function(user){
	port1.write('s');
});
process.on('command:targets:clear', function(user){
	clearAll();
});

// GAMEPLAY PORTION
var gameplaySequence = {
	0: setupRandomTargets,
	8: clearAll,
	10: setupRandomTargets,
	18: clearAll,
	20: setupRandomTargets,
	28: clearAll,
	30: setupRandomTargets,
	38: clearAll,
	40: setupRandomTargets,
	48: clearAll,
	50: setupRandomTargets,
	58: clearAll,
	60: setupRandomTargets,
	58: clearAll
};

process.on('time:update', function(time){
	if(gameplaySequence[time]){
		gameplaySequence[time]();
	}
});
