var express = require('express');
var server = express();
var db = require('./libs/database');
var targets = require('./libs/targets');
var sounds = require('./libs/sounds');
var gameplay = require('./libs/gameplay');
var gameplay = require('./libs/displays');
var camera = require('./libs/camera');

server.use(express.static('public'));
var bodyParser = require('body-parser')
server.use(bodyParser.json());       // to support JSON-encoded bodies

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
			ok: true
		});
	});
});

// START GAME OF EXISTING USER
server.get('/api/user/:userId/start', function (req, res) {
	process.emit('userstart', req.params.userId);
	res.send({
		ok: true
	});
});


server.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});