const gameTemplate = {
	userId: null,
	secondsRemaining: 120,
	totalSeconds: 120,
	score: 0,
	strikes: [],
	inProgress: true
};
var secondInterval;

// WHEN THE "userstart" HAPPENS
process.on('prestart', onPrestart);
process.on('userstart', onUserStart);
process.on('strike', onStrike);
process.on('time:update:' + gameTemplate.secondsRemaining, tearDownGame);

setupNewGame();
process.game.inProgress = false;
function setupNewGame(){
	console.log('gameplay:setupNewGame');
	process.game = JSON.parse(JSON.stringify(gameTemplate));
}

function onPrestart(userId){
	setTimeout(function(){
		process.emit('userstart', userId);
		process.game.inProgress = true;
	}, 6000);
}

function onUserStart(userId){
	setupNewGame();
	process.game.userId = userId;
	secondInterval = setInterval(onSecondInterval, 1000);
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
	var currentSecond = process.game.totalSeconds - process.game.secondsRemaining;

	var scoreToAdd = 3;
	if(currentSecond > 85 && currentSecond < 108){
		scoreToAdd = 10;
	}

	process.game.score += scoreToAdd;
	process.emit('score:update', process.game.strikes.length);
	console.log('gameplay:onStrike strikes:' + process.game.strikes.length);
}


function tearDownGame(){
	process.game.inProgress = false;
	process.emit('game:complete');
	console.log('GAME COMPLETE');
	console.log('Hits:' + process.game.strikes.length);
	clearInterval(secondInterval);
}
