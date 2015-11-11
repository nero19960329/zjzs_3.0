var model = require('../models/models');

var USER_DB = model.students;
var db = model.db;

var time_1 = (new Date()).getTime();
var time_2;

random_bind(1);

function random_bind(i) {
	if (i === 10001) {
		time_2 = (new Date()).getTime();
		console.log("time: " + (time_2 - time_1));
		return;
	}

	db[USER_DB].insert({
		weixin_id: "" + i,
		stu_id: "" + i,
		status: 1,
		credit: 0,
		punish: 0
	}, function(err, docs) {
		if (err) {
			console.log("shit!");
			return;
		}
		//console.log(i + " ok!");
		random_bind(i + 1);
	});
}