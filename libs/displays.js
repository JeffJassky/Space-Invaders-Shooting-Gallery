const SerialPort = require('serialport');
const displayPortId = '';
var port;

SerialPort.list(function (err, ports) {
        var portFound = false;
        ports.forEach(function(port) {
                if(port.pnpId === displayPortId){
                        portFound = true;
                        connectDisplayPort(port.comName);
                }
        });
        if(!portFound){
                console.log("DISPLAYS: Port not connected");
        }
});

function connectDisplayPort(portName){

	port = new SerialPort('/dev/ttyACM2', {
		parser: SerialPort.parsers.readline('\n')
	}).on('open',function(err){
		if(err){
			return console.log('could not find targets arduino');
		}
		console.log('Screens connected');

		port.write("0:10:10:1:1:2:3" + "\r");
	});
}

function onTimeUpdate(){

	var data = [];

	// serialize effects code
	data.push(0);

	// serialize score
	console.log('score:', process.game.score);

	
	for(var x = 1; x <= (3 - process.game.score.toString().length); x++){
		data.push(10);
	}
	data.push.apply(data, process.game.score.toString().split());

	var minutes = Math.floor(process.game.secondsRemaining / 60);

	var tens = Math.floor(
		(process.game.secondsRemaining - (minutes * 60)) / 10
	);
	var seconds = Math.floor(
		(process.game.secondsRemaining - (minutes * 60) - (tens * 10))
	);

	data.push(minutes, tens, seconds);

	console.log('"'+data.join(':') + '"');
	if(port){
		port.write(data.join(':'));
	}
}

// process.on('score:update', send);
process.on('time:update', onTimeUpdate);

