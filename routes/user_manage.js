var express = require('express');
var moment = require('moment');
var router = express.Router();

var model = require('../models/models');
var lock = require('../models/lock');
var urls = require("../address_configure");
var checkin = require('./checkin');
var cm = require("../weixin_basic/custom_menu");
var act_info = require('../weixin_basic/activity_info');
var cache = require("../weixin_handler/handler_ticket");

var listRoute = require("./user_manage_list");
var deleteRoute = require("./user_manage_delete");
var exportRoute = require("./user_manage_export");
var newactRoute = require("./user_manage_newact");

var ADMIN_DB = model.admins;
var db = model.db;
var getIDClass = model.getIDClass;
var ACTIVITY_DB = model.activities;
var TICKET_DB = model.tickets;
var SEAT_DB = model.seats;

var seat_row_2 = 8;
var seat_col_2 = 40;

router.get("/", function(req, res)
{
	res.redirect("/users/manage/list");
});

router.use("/checkin",checkin);
router.use("/list", listRoute);
router.use("/delete", deleteRoute);
router.use("/export", exportRoute);
router.use("/detail", newactRoute);

module.exports = router;
