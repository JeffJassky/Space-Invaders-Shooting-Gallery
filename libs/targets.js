const SerialPort = require('serialport');

const events = [
	'start',
	'strike',
	'wave',
	'clear'
];

var port = new SerialPort('/dev/cu.usbmodem1411', {
  parser: SerialPort.parsers.readline('\n')
});

port.on('open',function(err){
	if(err){
		return console.log('could not find targets arduino');
	}
	console.log('Targets connected');
}).on('data', function (data) {
	for(var i=0; i <= events.length; i++){
		if(data.indexOf(events[i]) !== -1){
			process.emit(events[i], data);
		}else{
			console.log('DEBUG DATA', data);
		}
	}
});


// WHEN THE "userstart" HAPPENS
process.on('userstart', function(user){
	port.write('s');
});