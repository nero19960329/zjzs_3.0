var set = require("./settings.js");
var https = require('https');
var model = require('../models/models');


var TOKEN_DB = model.accesstoken;
var db = model.db;
var ACCESS_TOKEN;
var AT_UPDATE_TIME;

exports.getAccessToken = function getAccessToken(callback){
    var now = new Date();
	db[TOKEN_DB].find({}, function(err, docs){
		if(!err && docs.length > 0){
			AT_UPDATE_TIME = docs[0].time;
			ACCESS_TOKEN = docs[0].token;
		}
		if(AT_UPDATE_TIME != undefined && now.getYear() == AT_UPDATE_TIME.getYear() && now.getMonth() == AT_UPDATE_TIME.getMonth() && now.getDay() == AT_UPDATE_TIME.getDay() && (now.getHours() - AT_UPDATE_TIME.getHours()) <= 1){
			callback(ACCESS_TOKEN);
		}
		else{
			var at_tmp = ACCESS_TOKEN;
			https.get("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+set.WEIXIN_APPID+"&secret="+set.WEIXIN_SECRET, function (response) {
				response.on('data', function(d) {
					var obj = JSON.parse(d);
					ACCESS_TOKEN = obj.access_token;
					AT_UPDATE_TIME = new Date();
					callback(ACCESS_TOKEN);
				});
			}).on('error', function(e) {
				console.error(e);
			});
		}
	})
}

exports.getAccessTokenValue = function getAccessToken(callback, arg1, arg2, arg3){
    var now = new Date();
  
    if(AT_UPDATE_TIME != undefined && now.getYear() == AT_UPDATE_TIME.getYear() && now.getMonth() == AT_UPDATE_TIME.getMonth() && now.getDay() == AT_UPDATE_TIME.getDay() && (now.getHours() - AT_UPDATE_TIME.getHours()) <= 1){
        callback(ACCESS_TOKEN, arg1, arg2, arg3);
    }
    else{
      var at_tmp = ACCESS_TOKEN;
      https.get("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+set.WEIXIN_APPID+"&secret="+set.WEIXIN_SECRET, function (response) {
            response.on('data', function(d) {
                var obj = JSON.parse(d);
                ACCESS_TOKEN = obj.access_token;
                AT_UPDATE_TIME = new Date();
				db[TOKEN_DB].find({}, function(err, docs){
					if(err){
						console.log("get token err in moudle message!");
						return -1;
					}
					else if(docs.length == 0){
						db[TOKEN_DB].insert({token : ACCESS_TOKEN, time : AT_UPDATE_TIME});
					}
					else{
						db[TOKEN_DB].update({_id: docs[0]._id}, {$set : {token : ACCESS_TOKEN, time : AT_UPDATE_TIME}});
					}
				});
                callback(ACCESS_TOKEN, arg1, arg2, arg3);
            });
        }).on('error', function(e) {
            console.error(e);
        });
    }
}

