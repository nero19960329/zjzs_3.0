//var at = require('../weixin_basic/access_token');
//var module_message = require('../weixin_basic/module_message');
//at.getAccessToken(module_message.sendModuleMessage);
var urls = require("../address_configure");

var fs = require('fs');
var path = require('path');

var http = require('https');
var activityName = "";
var activityTime = "";
var activityPos = "";

// <0: punished value
// 0 : ticket avaliable
// 1 : haven't validated
// 2 : already get ticket
// 3 : db errors
// 4 : no more ticket
var errors = {1:"您没有绑定学号。", 2:"您已经抢到票了，不能再抢。", 3:"数据库炸了(╯‵□′)╯︵┻━┻", 4:"您来晚了，票已经被抢完了。"};

var successData = {
    "touser": "",
    "template_id":"hqSm2GIkM0E-hyfJ4kfKt7NCWbGmd0N8OYgFR28lcsk",
    "url":"",
    "topcolor":"#FF0000",
    "data":{
        "first":{
            "value":"有票自远方来，不亦乐乎？",
            "color":"#173177"
        },
        "keyword1":{
            "value":"",
            "color":"#173177"
        },
        "keyword2":{
            "value":"",
            "color":"#173177"
        },
        "keyword3":{
            "value":"",
            "color":"#173177"
        },
        "keyword4":{
            "value":"",
            "color":"#173177"
        },
        "remark":{
            "value":"\n点击本消息即可查看电子票详细信息。",
            "color":"#173177"
        }
    }
};

var failData = {
    "touser": "",
    "template_id":"wIFe7ynUxTsziuOz0wJx956OYb-X1GWlJ6t2I8X6s0o",
    "url":"",
    "topcolor":"#FF0000",
    "data":{
        "first":{
            "value":"",
            "color":"#173177"
        },
        "keyword1":{
            "value":"",
            "color":"#173177"
        },
        "keyword2":{
            "value":"",
            "color":"#173177"
        },
        "remark":{
            "value":"\n欢迎您继续关注后续抢票活动！",
            "color":"#173177"
        }
    }
};
/*
exports.setActivityInfo = function (name, time, pos){
    //activityName = name;
    //activityTime = time;
    //activityPos = pos;
    successData.data.keyword1.value = name;
    successData.data.keyword2.value = time;
    successData.data.keyword3.value = pos;

    failData.data.keyword1.value = name;
};
*/
function addZero(num)
{
    if (num<10)
        return "0"+num;
    return ""+num;
}

function getTime(datet,isSecond)
{
    if (!(datet instanceof Date))
        datet=new Date(datet);
    datet.getMinutes();
    return datet.getFullYear() + "-"
        + (datet.getMonth()+1) + "-"
        + (datet.getDate()) + " "
        + addZero(datet.getHours()) + ":"
        + addZero(datet.getMinutes())
        + (isSecond===true? ":"+datet.getSeconds() : "");
}

function transferTicketId(ticketid, year) {
    var str = ticketid.substring(0,12);
    var ticketIdTransferd = 0;
    var i = 0;
    for(i=0; i<str.length; i++){
        ticketIdTransferd = ticketIdTransferd * 10 + str[i].charCodeAt() % 10;
    }
    ticketIdTransferd = year + ticketIdTransferd;
    return ticketIdTransferd;
}

exports.sendSuccessMessage = function (access_token, openid, ticketid, staticACT) {
	successData.data.keyword1.value = staticACT.name;
    var starttime = getTime(staticACT.start_time);
	var endtime = getTime(staticACT.end_time);
	//省略同一天开始结束时间的年月日
	if(starttime.substring(0, starttime.length - 5) === endtime.substring(0, endtime.length - 5))
	{
		endtime = endtime.substring(endtime.length - 5, endtime.length);
	}
	successData.data.keyword2.value = starttime + " ~ " + endtime;
    successData.data.keyword3.value = staticACT.place;
    successData.touser = openid;
    successData.data.keyword4.value = transferTicketId(ticketid, getTime(staticACT.start_time).substring(0, 4));
    successData.url = urls.ticketInfo + "?ticketid=" + ticketid;
    var tsuccessData = JSON.stringify(successData);
    var opt = {
		hostname: 'api.weixin.qq.com',
		port: '443',
		path: '/cgi-bin/message/template/send?access_token='+access_token,
		method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    //console.log(opt);

    var req = http.request(opt, function (res) {
        res.on('data', function (data) {
        	//process.stdout.write(data);
        	//console.log(tsuccessData);
        }).on('error', function (e) {
        	console.log(e);
        	
        });
    }).on('error', function(e) {
		console.error(e);
		fs.appendFile('../module_message_error.log', 'error occured!\n');
		for (var attr in e) {
			fs.appendFile('../module_message_error.log', attr + ': ' + e[attr]);
		}
		fs.appendFile('../module_message_error.log', '\n');
    });
    req.write(tsuccessData);
    req.end();
};

exports.sendFailMessage = function (access_token, openid, reason, staticACT) {
	failData.data.keyword1.value = staticACT.name;
    failData.touser = openid;
    if (reason.errcode > 0){
        failData.data.keyword2.value = errors[reason.errcode];
    }else{
        failData.data.keyword2.value = "由于以前的不良抢票记录，账号被冻结。";
    }
    if(reason.errcode < 0) {
        failData.data.remark.value = "您的账号将于" + (-reason) + "次活动后被解禁。\n欢迎您继续关注后续抢票活动！";
        failData.url = "";
    } else if(reason.errcode == 1) {
        failData.data.remark.value = "请先点击详情进入绑定页面进行绑定，再进行抢票操作。\n欢迎您继续关注后续抢票活动！";
        failData.url = urls.validateAddress+"?openid="+openid;
    } else if(reason.errcode == 2) {
        failData.data.remark.value = "\n点击本消息即可查看电子票详细信息。";
        failData.url = urls.ticketInfo + "?ticketid=" + reason.ticketid;
	} else {
        failData.data.remark.value = "\n欢迎您继续关注后续抢票活动！";
        failData.url = "";
    }
    if (reason.errcode == 2) {
    	failData.data.first.value = "";
    } else {
    	failData.data.first.value = "人无票而不愠，不亦君子乎？";
    }

    var tfailData = JSON.stringify(failData);
    var opt = {
        hostname: 'api.weixin.qq.com',
        port: '443',
        path: '/cgi-bin/message/template/send?access_token='+access_token,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    //console.log(opt);

    var req = http.request(opt, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            //process.stdout.write(data);
            //console.log(tfailData);
            console.log(data);
        }).on('error', function (e) {
        	console.log(e);
        	fs.appendFile('../module_message_error.log', 'error occured!\n');
			for (var attr in e) {
				fs.appendFile('../module_message_error.log', attr + ': ' + e[attr]);
			}
			fs.appendFile('../module_message_error.log', '\n');
        });
    }).on('error', function(e){
        console.error(e);
    });
    console.log("prepare write");
    console.log(tfailData);
    console.log(req.write(tfailData));
    console.log("write ok");
    req.end();
};


//sendSuccessMessage(getAccessToken(getValue), openid, ticketid);
