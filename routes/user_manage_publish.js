/**
 * Created by zhuangtianyi on 15/11/27.
 */

'use strict';

var express = require('express');
var fs = require('fs');
var https = require('https');
var wechat_api = require('wechat-api');
var im = require('imagemagick');
var path = require('path');
var set = require('../weixin_basic/settings');
var token = require('../weixin_basic/access_token');
var model = require('../models/models');

var router = express.Router();

var api = new wechat_api(set.WEIXIN_APPID, set.WEIXIN_SECRET, token.getAccessToken2);

var db = model.db;
var getIDClass = model.getIDClass;
var ACTIVITY_DB = model.activities;
var TICKET_DB = model.tickets;

var news = {
  articles: []
};

function upload(act_ids, i, res, callback) {
  if (i == act_ids.length) {
    callback(res);
    return;
  }

  db[ACTIVITY_DB].find({ _id: getIDClass(act_ids[i]) }, function(err, docs) {
    if (err || docs.length == 0) {
      console.log(err);
      res.send('找不到活动');
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
      act_name: act_obj.name,
      seat_type: act_obj.need_seat,
      act_desc: act_obj.description
        .replace(/ /g,"&nbsp;")
        .replace(/"/g,"&quot;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/\\n/g,"<br>"),
      act_place: act_obj.place
    };

    res.render('activity_detail_user_news', actinfo, function(err, html) {
      var file_path = path.join(__dirname.substring(0, __dirname.indexOf('route')), 'public', act_obj.pic_url.substr(act_obj.pic_url.indexOf('uploadpics')));
      //var file_src = fs.createReadStream(file_path);
      var ext = path.extname(file_path);
      var file_min_path = file_path.substring(0, file_path.lastIndexOf(ext)) + '.min' + ext;

      var image = {
        path: file_path
      };

      im.crop({
        srcPath: file_path,
        dstPath: file_min_path,
        width: 400,
        height: 200,
        quality: 0.5,
        gravity: "North"
      }, function(err) {
        if (err || !fs.existsSync(file_min_path)) {
          file_min_path = file_path;
          console.error(err);
        }

        api.uploadMedia(file_min_path, 'thumb', function(err, thumb_result) {
          if (err) {
            res.send('缩略图上传失败，图片过大');
            console.error(err);
            return;
          }

          news.articles.push({
            thumb_media_id: thumb_result.thumb_media_id,
            author: '清华大学紫荆之声',
            title: act_obj.name,
            content: html,
            show_cover_pic: '1'
          });

          upload(act_ids, i + 1, res, callback);
        });
      });
    });
  });
}

router.get('/', function(req, res) {
  if (req.query.actids == undefined && req.query.actid == undefined) {
    res.send('缺少 actids 或 actid 参数');
    return;
  }

  var act_ids;

  if (req.query.actids) {
    act_ids = req.query.actids.split(',');
  } else {
    act_ids = [req.query.actid];
  }



  news.articles.length = 0;

  upload(act_ids, 0, res, function(_res) {
    api.uploadNews(news, function(err, news_result) {
      if (err) {
        _res.send('图文消息上传失败');
        console.error(err);
        return;
      }

      console.log(news_result);
      api.previewNews('oa7m1t8aOmoGDoGRaULZeHii65RE', news_result.media_id, function(err, mass_result) {
      //api.massSendNews(news_result.media_id, true, function(err, mass_result) {
        if (err) {
          _res.send('图文消息推送失败');
          console.error(err);
          return;
        }

        res.send('<html><head></head><body><h1>推送成功 三秒后返回</h1><script> window.onload = function() { setTimeout(function() { window.location = "/users/manage/list"; }, 3000); } </script></body></html>');
      });
    });
  });
});

module.exports = router;
