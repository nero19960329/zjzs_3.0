var express = require('express');
var nodeExcel = require('excel-export');
var router = express.Router();

var model = require('../models/models');

var db = model.db;
var getIDClass = model.getIDClass;
var ACTIVITY_DB = model.activities;
var TICKET_DB = model.tickets;

router.get("/", function(req, res){
	if (req.query.actid == undefined)
	{
		res.send("导出命令缺少actid参数！");
		return;
	}

	var idObj = getIDClass(req.query.actid);
	db[ACTIVITY_DB].find({_id:idObj}, function(err, docs){
		if (err || docs.length == 0)
		{
			res.send("找不到要导出的活动！");
			return;
		}

		var filename = docs[0]["name"] + ".xlsx";
		var payFlag;
		var seatFlag;
		var conf ={};

		payFlag = (docs[0].need_seat == 2);
		seatFlag = docs[0].need_seat;

		conf.cols = [{caption:'学号', type:'string'}];
		if (payFlag)
			conf.cols.push({caption:'支付状态', type:'string'});
		conf.cols.push({caption:'入场状态', type:'string'});
		if (seatFlag != 0)
			conf.cols.push({caption:'座位', type:'string'});

		db[TICKET_DB].find({activity:idObj, status:{$ne:0}}, function(err, docs){
			if (err)
			{
				res.send("票务数据库查找出错！");
				return;
			}
			conf.rows = [];
			for (var i = 0; i < docs.length; i++)
			{
				var item = [];
				item.push(docs[i]["stu_id"]);
				if (payFlag) //需要支付
				{
					if (docs[i].status == 1)
					{
						if (docs[i].cost == 0)
							item.push("免费票");
						else
							item.push("未支付");
						item.push("未入场");
					}
					else if (docs[i].status == 2)
					{
						item.push("已支付");
						item.push("未入场");
					}
					else
					{
						if (docs[i].cost == 0)
							item.push("免费票");
						else
							item.push("已支付");
						item.push("已入场");
					}
				}
				else //不需要支付
				{
					if (docs[i].status != 3)
						item.push("未入场");
					else
						item.push("已入场");
				}

				if (seatFlag == 1) //分区选座的活动
				{
					switch (docs[i].seat)
					{
					case "A_area":
						item.push("A区");
						break;
					case "B_area":
						item.push("B区");
						break;
					case "C_area":
						item.push("C区");
						break;
					case "D_area":
						item.push("D区");
						break;
					case "E_area":
						item.push("E区");
						break;
					default:
						item.push("未选区");
					}
				}

				if (seatFlag == 2) //精确选座的活动
				{
					if (docs[i].seat)
						item.push(docs[i].seat);
					else
						item.push("未选座");
				}

				conf.rows.push(item);
			}

			var result = nodeExcel.execute(conf);
			res.setHeader('Content-Type', 'application/vnd.openxmlformats');

			var userAgent = (req.headers['user-agent']||'').toLowerCase();
			if(userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0)
				res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(filename));
			else if(userAgent.indexOf('firefox') >= 0)
				res.setHeader('Content-Disposition', 'attachment; filename*="utf8\'\''
							  + encodeURIComponent(filename)+'"');
			else
				res.setHeader('Content-Disposition', 'attachment; filename='
							  + new Buffer(filename).toString('binary'));

			res.end(result, 'binary');
		});
	});
});

module.exports = router;