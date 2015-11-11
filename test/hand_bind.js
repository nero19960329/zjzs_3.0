var fs = require("fs");
var model = require('../models/models');

var USER_DB = model.students;
var db = model.db;

fs.readFile("./open_ids_u.txt", "utf-8", function(err, data) {
	if (err) {
		throw err;
	}

	var lines = data.split('\n');
	var length = lines.length;
	for (var i = 0; i < length; ++i) {
		var open_id = lines[i].split('\t')[2];
		console.log(open_id);
		db[USER_DB].insert({
			weixin_id: open_id,
			stu_id: open_id,
			status: 1,
			credit: 0,
			punish: 0
		}, function(err, docs) {
			if (err) {
				console.log("shit!");
				return;
			}
		});
	}
});