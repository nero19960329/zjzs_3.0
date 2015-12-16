/* Author: Wang ZHao
 * Create Time: 2015/12/16 20:22
 */
var express = require('express');
var router = express.Router();

var model = require('../models/models');
var urls = require('../address_configure.js');

router.get("/", function(req, res, next) {
    if (req.query.actid == null) {
        res.send("Activity not exist!");
        return;
    }

    res.render("activity_preview", {
        url: 'actinfo?actid=' + req.query.actid,
    });
});

module.exports = router;
