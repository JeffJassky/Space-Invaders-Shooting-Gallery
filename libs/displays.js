const SerialPort = require('serialport');
const displayPortId = 'usb-Arduino_LLC_Arduino_Leonardo-if00';
var port;
const effects = [2,3,4];
const numberEffects = [11,12,13];

const defaultEffectCode = 1;


SerialPort.list(function (err, ports) {
        var portFound = false;
        ports.forEach(function(port) {
                if(port.pnpId === displayPortId){
                        portFound = true;
 			console.log('SCREEN PORT FOUND');
                        connectDisplayPort(port.comName);
                }
        });
        if(!portFound){
                console.log("DISPLAYS: Port not connected");
        }
});


process.on('prestart', function(){
	console.log("new game");
        port.write('10'+"\n");
	setTimeout(function(){
		console.log("3");
	        port.write('00100310100310'+"\n");
	}, 4000);
	setTimeout(function(){
		console.log("2");
	        port.write('00100210100210'+"\n");
	}, 5000);
        setTimeout(function(){
		console.log('1');
                port.write('00100110100110'+"\n");
        }, 6000);
});


function connectDisplayPort(portName){

	port = new SerialPort(portName, {
		parser: SerialPort.parsers.readline('\n')
	}).on('open',function(err){
		if(err){
			return console.log('could not find targets arduino');
		}
		console.log('Screens connected');
	}).on('error', function(error){
		console.log('SERIAL ERROR', error);
	});
}

function onTimeUpdate(){

	var data = [];
	// serialize effects code
	
	var effectCode = effects[Math.floor(Math.random()*effects.length)];
	data.push(effectCode);

	// serialize score
	console.log('score:', process.game.score);

	
	for(var x = 1; x <= (3 - process.game.score.toString().length); x++){
		data.push(10);
	}
	data.push.apply(data, process.game.score.toString().split(''));

	var minutes = Math.floor(process.game.secondsRemaining / 60);

	var tens = Math.floor(
		(process.game.secondsRemaining - (minutes * 60)) / 10
	);
	var seconds = Math.floor(
		(process.game.secondsRemaining - (minutes * 60) - (tens * 10))
	);

	data.push(minutes, tens, seconds);

	for(var i=0; i<=data.length-1; i++){
		data[i] = data[i].toString().length === 1 ? '0' + data[i] : data[i];
	}
	console.log('"'+data.join('-') + '"');
	if(port){
		port.write(data.join('') +  "\n");
	}
}

// process.on('score:update', send);
process.on('time:update', onTimeUpdate);

process.on('game:complete', function(){
	setTimeout(sendRandomEffectCode, 5000);
});

function sendRandomEffectCode() {
	var effectCode = numberEffects[Math.floor(Math.random()*numberEffects.length)];
	port.write(effectCode + "\n");
}
