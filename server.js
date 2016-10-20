var express = require('express');
var server = express();
var db = require('./libs/database');
var targets = require('./libs/targets');
var sounds = require('./libs/sounds');
var gameplay = require('./libs/gameplay');
var displays = require('./libs/displays');
// var camera = require('./libs/camera');

server.use(express.static('public'));
server.use(express.static('resources/pictures'));
var bodyParser = require('body-parser')
// server.use(bodyParser.json());       // to support JSON-encoded bodies
server.use(bodyParser.urlencoded({ extended: false }));

// LIST OF USERS IN QUEUE
server.get('/api/users', function (req, res) {
	db.listUsers(function(err, users){
		res.send(users);
	});
});

// CREATE A NEW USER
server.post('/api/user', function (req, res) {
	db.addUser(req.body, function(){
		res.send({
			success: true
		});
	});
});


// CREATE A NEW USER
server.delete('/api/user', function (req, res) {
        db.deleteUser(req.body, function(){
                res.send({
                        success: true
                });
        });
});

// START GAME OF EXISTING USER
server.get('/api/user/:userId/start', function (req, res) {
	if(!process.game.inProgress){
		process.emit('prestart', req.params.userId);
	}
	res.send({
		success: true
	});
});


server.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});
