var express = require('express');
var router = express.Router();

var model = require('../models/models');

var db = model.db;
var SEATMODULE_DB = model.seat_modules;

router.post("/", function(req, res) {
	if (req.body.seat_map != undefined) { // 添加模板
		db[SEATMODULE_DB].find({
			name: req.body.name
		}, function(err, docs) {
			if (err || docs.length != 0) {
				res.send({status: "error"});
				return;
			}

			db[SEATMODULE_DB].insert({
				id: (new Date()).getTime(),
				name: req.body.name,
				seat_map: JSON.parse(req.body.seat_map)
			}, function() {
				db[SEATMODULE_DB].find({}, {sort: {id: 1}}, function(err2, docs2) {
					if (err) {
						return;
					}

					res.send({
						status: "success",
						seat_maps: docs2
					});
				})
			});
		})
	} else { // 删除模板
		db[SEATMODULE_DB].remove({
			name: req.body.name
		}, function() {
			db[SEATMODULE_DB].find({}, {sort: {id: 1}}, function(err, docs) {
				res.send({
					seat_maps: docs
				});
			});
		});
	}
});

module.exports = router;
