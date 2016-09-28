// effects-code:score-hundreds:score-tens:score-ones: time-mins:time-sec-tens:time-sec-ones

// 0
// 10:10:5
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
});


function send(){

	var data = [];

	// serialize effects code
	data[] = 0;

	// serialize score
	for(var x = q; x <= (3 - process.game.score.length); x++){
		data[] = 10;
	}
	data.push.apply(this, process.game.score.split());

	var minutes = Math.floor(process.game.secondsRemaining / 60);
	var tens = Math.floor(
		(process.game.secondsRemaining - (minutes * 60)) / 10
	);
	var seconds = Math.floor(
		(process.game.secondsRemaining - (minutes * 60) - (tens * 10))
	)
	console.log(data.join(':'));

}

process.on('score:update', send);
process.on('time:update', send);
