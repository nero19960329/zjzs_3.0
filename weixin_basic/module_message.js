//var at = require('../weixin_basic/access_token');
//var module_message = require('../weixin_basic/module_message');
//at.getAccessToken(module_message.sendModuleMessage);
var urls = require("../address_configure");

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
var errors = {1:"您没有未绑定学号。", 2:"您已经抢到票了，不能再抢。", 3:"数据库炸了(╯‵□′)╯︵┻━┻", 4:"您来晚了，票已经被抢完了。"};

var successData = {
    "touser": "",
    "template_id":"k6H6vuy2fcsz9JYKQ_rK1YybYLORpJ8NhJNqcLqKhKs",
    "url":"",
    "topcolor":"#FF0000",
    "data":{
        "first":{
            "value":"恭喜您抢票成功了！",
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
            "value":"\n点击详情可查看电子票详细信息。",
            "color":"#173177"
        }
    }
};

var failData = {
    "touser": "",
    "template_id":"bJcuCksZhI36c9OBWBMolPHcnAH_fMEy-Qrj4unLv7s",
    "url":"",
    "topcolor":"#FF0000",
    "data":{
        "first":{
            "value":"很遗憾，您抢票失败了！",
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

exports.sendSuccessMessage = function (access_token, openid, ticketid, staticACT) {
	successData.data.keyword1.value = staticACT.name;
    successData.data.keyword2.value = getTime(staticACT.start_time)+" ~ "+getTime(staticACT.end_time);
    successData.data.keyword3.value = staticACT.place;
    successData.touser = openid;
    successData.data.keyword4.value = ticketid;
    successData.url = urls.ticketInfo + "?ticketid=" + ticketid;
    var tsuccessData = JSON.stringify(successData);
    var opt = {
		hostname: 'api.weixin.qq.com',
		port: '443',
		path: '/cgi-bin/message/template/send?access_token='+access_token,
		method: 'POST'
    };

    console.log(opt);

    var req = http.request(opt, function (res) {
        res.on('data', function (data) {
        	//process.stdout.write(data);
        	console.log(tsuccessData);
        });
    });
    req.write(tsuccessData);
    req.end();
};

exports.sendFailMessage = function (access_token, openid, reason, staticACT) {
	failData.data.keyword1.value = staticACT.name;
    failData.touser = openid;
    if (reason > 0){
        failData.data.keyword2.value = errors[reason];
    }else{
        failData.data.keyword2.value = "由于以前的不良抢票记录，账号被冻结。";
    }
    if(reason < 0){
        failData.data.remark.value = "您的账号将于" + (-reason) + "次活动后被解禁。" + failData.data.remark.value;
        failData.url = "";
    }else if(reason == 1){
        failData.data.remark.value = "请先点击详情进入绑定页面进行绑定，再进行抢票操作。" + failData.data.remark.value;
        failData.url = urls.validateAddress+"?openid="+openid;
    }
    else{
        failData.data.remark.value = "\n欢迎您继续关注后续抢票活动！";
        failData.url = "";
    }

    var tfailData = JSON.stringify(failData);
    var opt = {
        hostname: 'api.weixin.qq.com',
        port: '443',
        path: '/cgi-bin/message/template/send?access_token='+access_token,
        method: 'POST'
    };

    console.log(opt);

    var req = http.request(opt, function (res) {
        res.on('data', function (data) {
            //process.stdout.write(data);
            console.log(tfailData);
        })
    }).on('error', function(e){
        console.error(e);
    });
    req.write(tfailData);
    req.end();
}


//sendSuccessMessage(getAccessToken(getValue), openid, ticketid);
