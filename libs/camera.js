var shelljs = require('shelljs/global');
var pictureFolder = 'resources/pictures/';

process.on('time:update', onTimeUpdate);

function onTimeUpdate(time){
	console.log('CAMERA: onTimeUpdate');
	if(time % 12 === 1){
		takePicture();
	}
}

function takePicture(){
        console.log('CAMERA: Taking picture');
        var fileName = process.game.userId + '_' + new Date().getTime() + '.jpg';
        exec('raspistill -n -o "'+pictureFolder+fileName+'"', {async: true});
        console.log(fileName);
        process.emit('picture', fileName);
}
