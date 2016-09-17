var shelljs = require('shelljs/global');
var pictureFolder = 'resources/pictures';

process.on('start', function(){
	console.log('Taking pictures');
	var fileName = new Date().getTime() + '.jpg';
	exec('imagesnap '+pictureFolder+'/'+fileName);
	console.log(fileName);
	process.emit('picture', fileName);
});