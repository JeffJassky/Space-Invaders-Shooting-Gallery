const gameTemplate = {
	userId: null,
	secondsRemaining: 120,
	score: 0,
	strikes: []
};
var secondInterval;

// WHEN THE "userstart" HAPPENS
process.on('userstart', onUserStart);
process.on('strike', onStrike);
process.on('time:update:' + gameTemplate.secondsRemaining, tearDownGame);

setupNewGame();

function setupNewGame(){
	console.log('gameplay:setupNewGame');
	process.game = JSON.parse(JSON.stringify(gameTemplate));
}

function onUserStart(userId){
	setupNewGame();
	process.game.userId = userId;
	secondInterval = setInterval(onSecondInterval, 5000);
	console.log('gameplay:onUserStart');
}

function onSecondInterval(){
	console.log('gameplay:onSecondInterval');
	process.game.secondsRemaining--;
	var currentTime = gameTemplate.secondsRemaining - process.game.secondsRemaining;
	process.emit('time:update', currentTime);
	process.emit('time:update:' + currentTime, currentTime);
	console.log('onSecondInterval');
}

function onStrike(strike){
	process.game.strikes.push(strike);
	process.game.score++;
	process.emit('score:update', process.game.strikes.length);
	console.log('gameplay:onStrike strikes:' + process.game.strikes.length);
}


function tearDownGame(){
	console.log('GAME COMPLETE');
	console.log('Hits:' + process.game.strikes.length);
	clearInterval(secondInterval);
}