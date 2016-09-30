var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('mydatabase.db');

process.on('game:complete', saveCurrentUser);


exports.addUser = function(user, callback){
	console.log(user.email, user.name);
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
			"select rowid as id, email, name, hits, score from users",
			callback
		);
	});
};

function saveCurrentUser(callback){
	console.log('DATABASE: SAVING USER: ' + process.game.userId);
	db.serialize(function() {
		db.run(
			'update users set score=?, hits=? where rowid=?',
			[process.game.score, JSON.stringify(process.game.strikes), process.game.userId],
			callback
		);
	});
}
