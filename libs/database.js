var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydatabase.db');

exports.addUser = function(user, callback){
	db.serialize(function() {
  		db.run(
  			'insert into users (email, name) values (?,?)',
  			[user.email, user.name],
  			callback
  		);
	});
};

exports.listUsers = function(callback){
	db.serialize(function() {
		db.all(
			"select rowid as id, email, name from users",
			callback
		);
	});
};