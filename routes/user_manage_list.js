var express = require('express');
var router = express.Router();

var model = require('../models/models');

var ACTIVITY_DB = model.activities;
var db = model.db;

router.get("/", function(req, res) {
	var activities1 = new Array();
	db[ACTIVITY_DB].find({status:{$gte:0}}, function(err, docs){
		if (err)
		{
			res.send("数据库抓取活动列表出错！请检查数据库。");
			return;
		}
		for (var i = 0; i < docs.length; i++)
		{
			var j = docs.length-1-i;
			var activity = {
        		status: docs[j].status,
        		name: docs[j].name,
				description: docs[j].description,
				start_time: docs[j].start_time,
				end_time: docs[j].end_time,
				place: docs[j].place,
				book_start: docs[j].book_start,
				book_end: docs[j].book_end,
				id: docs[j]["_id"].toString()
    		};
    		activities1[i] = activity;
		}
		res.render("activity_list", {activities1: activities1});
	});
});

module.exports = router;