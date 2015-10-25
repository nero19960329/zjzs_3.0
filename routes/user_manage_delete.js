var express = require('express');
var moment = require('moment');
var router = express.Router();

var model = require('../models/models');
var lock = require('../models/lock');

var db = model.db;
var getIDClass = model.getIDClass;
var ACTIVITY_DB = model.activities;

router.post("/", function(req, res){
	var idObj = getIDClass(req.body.activityId);
	var activity = {status:-1};
	lock.acquire(ACTIVITY_DB, function(){
		db[ACTIVITY_DB].find({_id:idObj}, function(err, docs){
			if (err || docs.length == 0)
			{
				res.send("数据库查找不到要删除的活动！");
				lock.release(ACTIVITY_DB);
				return;
			}
			if (docs[0]["status"] == 1 &&
				moment(docs[0]["book_start"]).isBefore() && moment(docs[0]["end_time"]).isAfter())
			{
				res.send("活动处于抢票开始到活动结束间的阶段，此阶段不能删除活动！");
				lock.release(ACTIVITY_DB);
				return;
			}
			db[ACTIVITY_DB].update({_id:idObj}, {$set: activity}, {multi:false}, function(err, result){
				if (err || result.n == 0)
				{
					res.send("数据库查找不到要删除的活动！");
					lock.release(ACTIVITY_DB);
				}
				else
				{
					res.send("活动删除成功！");
					lock.release(ACTIVITY_DB);
				}
			});
		});

	});
});

module.exports = router;