var model = require('../models/models');

var handleRequest = require("../routes/handleRequest");

var REQUEST_DB = model.requests;
var ACTIVITY_DB = model.activities;
var db = model.db;

var fs = require("fs");

/* 获取从1970年1月1日至今的毫秒数 */
var currentTime = (new Date()).getTime();

db[ACTIVITY_DB].find({book_start: {$lte: currentTime}, book_end: {$gte: currentTime}}, function(err, docs) {
	if (err || docs.length == 0) {
		process.exit(0);
	}
	
	var length = docs.length;
	
	for (var i = 0; i < length; ++i) {
		handleRequest.handleSingleActivity(docs[i].key);
	}
	
	//process.exit(0)
});

