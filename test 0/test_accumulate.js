var model = require('../models/models');

var REQUEST_DB = model.requests;
var db = model.db;

var time_1 = (new Date()).getTime();
var time_2;

var time = 1447229100000;

generate_request(1, 0);

function generate_request(i, j) {
	if (i === 1001) {
		time_2 = (new Date()).getTime();
		//console.log("time: " + (time_2 - time_1));
		return;
	}

	var flag = 0;
	if (j == 0) {
		j = Math.round(Math.random() * 4 + 1);
		flag = 1;
	}

	++time;
	db[REQUEST_DB].insert({
		weixin_id: "" + i,
		time: time,
		act_name: "test"
	}, function(err, docs) {
		if (err) {
			console.log("shit!");
			return;
		}
		//console.log("i: " + i + ", j: " + j);
		generate_request(i + flag, j - 1);
	});
}