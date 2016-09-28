// effects-code:score-hundreds:score-tens:score-ones: time-mins:time-sec-tens:time-sec-ones

// 0
// "time:  5"
// 1:3:4

const SerialPort = require('serialport');

var port = new SerialPort('/dev/cu.usbmodem1411', {
  parser: SerialPort.parsers.readline('\n')
});

port.on('open',function(err){
	if(err){
		return console.log('could not find targets arduino');
	}
	console.log('Screens connected');

	port.write("0:10:10:1:1:2:3" + "\r");
});

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
	port.write(data.join(':'));

}

// process.on('score:update', send);
process.on('time:update', onTimeUpdate);

