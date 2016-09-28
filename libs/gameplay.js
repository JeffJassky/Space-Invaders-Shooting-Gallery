const gameTemplate = {
	userId: null,
	timeRemaining: 120,
	hits: []
};
var secondInterval;

// WHEN THE "userstart" HAPPENS
process.on('userstart', onUserStart);
process.on('strike', onStrike);
process.on('time:update:' + gameTemplate.timeRemaining, tearDownGame);

setupNewGame();

function onUserStart(userId){
	setupNewGame();
	process.game.userId = userId;
	secondInterval = setInterval(onSecondInterval, 1000);
	console.log('gameplay:onUserStart');
}

function onSecondInterval(){
	console.log('gameplay:onSecondInterval');
	process.game.timeRemaining--;
	var currentTime = gameTemplate.timeRemaining - process.game.timeRemaining;
	process.emit('time:update', currentTime);
	process.emit('time:update:' + currentTime, currentTime);
	console.log('onSecondInterval');
}

function onStrike(strike){
	process.game.hits.push(strike);
	process.emit('score:update', process.game.hits.length);
	console.log('gameplay:onStrike hits:' + process.game.hits.length);
}

function setupNewGame(){
	console.log('gameplay:setupNewGame');
	process.game = JSON.parse(JSON.stringify(gameTemplate));
}

function tearDownGame(){
	console.log('GAME COMPLETE');
	console.log('Hits:' + process.game.hits.length);
	clearInterval(secondInterval);
}