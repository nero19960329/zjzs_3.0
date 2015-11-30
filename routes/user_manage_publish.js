/**
 * Created by zhuangtianyi on 15/11/27.
 */

'use strict';

var express = require('express');
var fs = require('fs');
var https = require('https');
var ejs = require('ejs');
var wechat_api = require('wechat-api');
var imagemin = require('image-min');
var path = require('path');
var set = require('../weixin_basic/settings');
var router = express.Router();
var api = new wechat_api(set.WEIXIN_APPID, set.WEIXIN_SECRET);

var model = require('../models/models');
var token = require('../weixin_basic/access_token');

var db = model.db;
var getIDClass = model.getIDClass;
var ACTIVITY_DB = model.activities;
var TICKET_DB = model.tickets;



router.get('/', function(req, res) {
  if (req.query.actid == undefined) {
    res.send('缺少 actid 参数');
    return;
  }

  //var template = fs.readFileSync('../views/activity_detail_user.ejs', 'utf-8');
  //console.log(template);
  //var content = ejs.compile();

  db[ACTIVITY_DB].find({ _id: getIDClass(req.query.actid ) }, function(err, docs) {
    if (err || docs.length === 0) {
      res.send('找不到要推送的活动');
    }

    var act_obj = docs[0];
    var act_start_date = new Date(act_obj.start_time).toLocaleDateString();
    var act_start_time = new Date(act_obj.start_time).toLocaleTimeString();
    var act_end_date = new Date(act_obj.end_time).toLocaleDateString();
    var act_end_time = new Date(act_obj.end_time).toLocaleTimeString();

    act_start_time = act_start_time.substr(0, act_start_time.length - 3);
    act_end_time = act_end_time.substr(0, act_end_time.length - 3);

    var act_start_time_str = act_start_date + ' ' + act_start_time;
    var act_end_time_str = (act_start_date === act_end_date)? act_end_time: act_end_date + ' ' + act_end_time;

    var act_book_start_date = new Date(act_obj.book_start).toLocaleDateString();
    var act_book_start_time = new Date(act_obj.book_start).toLocaleTimeString();
    var act_book_end_date = new Date(act_obj.book_end).toLocaleDateString();
    var act_book_end_time = new Date(act_obj.book_end).toLocaleTimeString();

    act_book_start_time = act_book_start_time.substr(0, act_book_start_time.length - 3);
    act_book_end_time = act_book_end_time.substr(0, act_book_end_time.length - 3);

    var act_book_start_time_str = act_book_start_date + ' ' + act_book_start_time;
    var act_book_end_time_str = (act_book_start_date === act_book_end_date)? act_book_end_time: act_book_end_date + ' ' + act_book_end_time;

    var actinfo = {
      act_start_time_str: act_start_time_str,
      act_end_time_str: act_end_time_str,
      act_book_start_time_str: act_book_start_time_str,
      act_book_end_time_str: act_book_end_time_str,
      current_time: (new Date()).getTime(),
      act_name: act_obj.name,
      seat_type: act_obj.need_seat,
      act_desc: act_obj.description
        .replace(/ /g,"&nbsp;")
        .replace(/"/g,"&quot;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/\\n/g,"<br>"),
      //act_pic_url: act_obj.pic_url,
      //ticket_status: act_obj.status,
      //act_key: act_obj.key,
      //rem_tik: act_obj.remain_tickets,
      act_place: act_obj.place
      //isManager: false
    };

    res.render('activity_detail_user_news', actinfo, function(err, html) {
      if (err) {
        res.send('模板错误');
        console.error(err);
        return;
      }

      var file_path = path.join(__dirname.substring(0, __dirname.indexOf('route')), 'public', act_obj.pic_url.substr(act_obj.pic_url.indexOf('uploadpics')));
      var file_src = fs.createReadStream(file_path);
      var ext = path.extname(file_src.path);
      var file_min_path = file_path.substring(0, file_path.lastIndexOf(ext)) + '.min' + ext;
      file_src.pipe(imagemin({ ext: ext })).pipe(fs.createWriteStream(file_min_path));

      api.uploadMedia(file_min_path, 'thumb', function(err, thumb_result) {
        if (err) {
          res.send('缩略图上传失败');
          console.error(err);
          return;
        }

        console.log(thumb_result);

        var news = {
          articles: [
            {
              thumb_media_id: thumb_result.thumb_media_id,
              author: '清华大学紫荆之声',
              title: act_obj.name,
              content: html,
              show_cover_pic: '1'
            }
          ]
        };

        api.uploadNews(news, function(err, news_result) {
          if (err) {
            res.send('图文消息上传失败');
            console.error(err);
            return;
          }

          console.log(news_result);
          api.previewNews('oa7m1t8aOmoGDoGRaULZeHii65RE', news_result.media_id, function(err, mass_result) {
            if (err) {
              res.send('图文消息推送失败');
              console.error(err);
              return;
            }

            res.send('<html><head></head><body><h1>推送成功 三秒后返回</h1><script> window.onload = function() { setTimeout(function() { window.location = "/users/manage/list"; }, 3000); } </script></body></html>');
          });
        });
      });
    });
  });
});

module.exports = router;
