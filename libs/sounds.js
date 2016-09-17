var player = require('play-sound')(); 

process.on('start', function(){
	console.log('Starting Game...');
	player.play('./resources/start.mp3');
})
process.on('strike', function(){
	console.log('STRIKE');
	player.play('./resources/strike.mp3');
})
process.on('wave', function(){
	console.log('New wave');
	player.play('./resources/wave.mp3');
})
process.on('clear', function(){
	console.log('Wave Cleared');
	player.play('./resources/clear.mp3');
})