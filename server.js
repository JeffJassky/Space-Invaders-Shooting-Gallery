var express = require('express');
var server = express();
var pgp = require('pg-promise')();
var db = pgp({
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: 'shootinggallery',
    user: 'jeffjassky',
    password: ''
}); // database instance;

server.use(express.static('public'));

server.post('/register', function (req, res) {
  res.send({
  	success: true
  });
});

server.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});