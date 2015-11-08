var at = require('../weixin_basic/access_token');
var moduleMsg = require('../weixin_basic/module_message');
var model = require('../models/models');

var REQUEST_DB = model.requests;
var TICKET_DB = model.tickets;
var USER_DB = model.students;
var ACTIVITY_DB = model.activities;
var SEAT_DB = model.seats;
var db = model.db;
//at.getAccessToken(module_message.sendSuccessMessage);

var alphabet = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";

var act_cache={};
var rem_cache={};
var tik_cache={};
var usr_lock={};

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
    datet.getMinutes()
    return datet.getFullYear() + "-"
        + (datet.getMonth()+1) + "-"
        + (datet.getDate()) + " "
        + addZero(datet.getHours()) + ":"
        + addZero(datet.getMinutes())
        + (isSecond===true? ":"+datet.getSeconds() : "");
}

function getRandomString()
{
    var ret="";

    for (var i=0;i<13;i++)
        ret+=alphabet[Math.floor(Math.random()*alphabet.length)];
    return ret;
}

function generateUniqueCode(prefix,actKey)
{
    while (true)
    {
        var tickCode=prefix+"_"+getRandomString();

        if (tik_cache[actKey].tikMap[tickCode]==null)
        {
            tik_cache[actKey].tikMap[tickCode] = true;
            return tickCode;
        }
    }
}

exports.handleSingleActivity = function (name){
	/*var res = 0;
	console.log(name);
	console.log("123123");
	db[REQUEST_DB].find({"test": "test"}, function(err, docs) {
		console.log("err: " + err);
		console.log("length: " + docs.length);
		var tmp = 0;
		while (tmp < 1) {
			tmp++;		
		}
		res = 1;
	});
	return res;*/
	db[REQUEST_DB].find({act_name:name}, {sort:{time:1}}, function(err, docs){
		console.log("length: " + docs.length);
		if (err || docs.length==0) {
			//nobody want this activity
            return -1;
        }
        var remain_tickets = 0;
        var activityName = "";
		var activityTime = "";
		var activityPos = "";
        var activity_id = 0;
        db[ACTIVITY_DB].find({key:name}, function(err2, docs2){
			if (err2 || docs2.length==0) {
				//no activity
	            return -1;
	        }
            if (tik_cache[name] == null){
                tik_cache[name] = {};
                tik_cache[name].tikMap = {};
            }
	        remain_tickets = docs2[0].remain_tickets;
	        activityName = docs2[0].name;
	        activityTime = getTime(docs2[0].start_time)+" ~ "+getTime(docs2[0].end_time);
	        activityPos = docs2[0].place;
            activity_id = docs2[0]._id;
	        moduleMsg.setActivityInfo(activityName, activityTime, activityPos);

            var len = docs.length;
            console.log("len: "+len);
            for (var i = 0; i < len; i++){
                //sorted by time
                var openid = docs[i].weixin_id;
                var res = distributeTicket(openid, docs2[0], remain_tickets);
                if(res == 0){
                    remain_tickets--;
                }
                db[REQUEST_DB].remove({_id:docs[i]._id});
            }
            db[ACTIVITY_DB].update({key:name}, {$set:{remain_tickets:remain_tickets}});
		});
	});
}

//return errnum 0:avaliable 1: 2: 3: ...
// <0: punished value
// 0 : ticket avaliable
// 1 : haven't validated
// 2 : already get ticket
// 3 : db errors
// 4 : no more ticket
function distributeTicket(openid, staticACT, remain_tickets){
    var res = 10000;
    db[USER_DB].find({weixin_id:openid}, function(err3, docs3){
        if (err3){
            res = 3;
            at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, 3);
        }else if(docs3.length == 0){
            res = 1;
            at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, 1);
        }else if (docs3[0].punish > 0){
            res = --docs3[0].punish;
            at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, -docs3[0].punish);
        }else{
            db[TICKET_DB].find({stu_id:docs3[0].stu_id, activity:staticACT._id}, function(err4, docs4){
                if (err4){
                    res = 3;
                    at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, 3);
                }else if (docs4.length == 0){
                    if(remain_tickets <= 0){
                        res = 4;
                        at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, 4);
                    }
                    else{
                        res = 0;
                        var stuID = docs3[0].stu_id;
                        var ss = staticACT._id.toString();
                        var tiCode = generateUniqueCode(ss.substr(0,8)+ss.substr(14),staticACT.key);
                        var price = 0;
                        if(staticACT.need_seat == 2){
                            price = parseInt(staticACT.price);
                        }
                    }
                    db[TICKET_DB].insert(
                    {
                        stu_id:     stuID,
                        unique_id:  tiCode,
                        activity:   staticACT._id,
                        status:     1,
                        seat:       "",
                        cost:       price
                    });
                    at.getAccessTokenValue(moduleMsg.sendSuccessMessage, openid, tiCode);
                }else{
                    res = 2;
                    at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, 2);
                }
            });
        }
    });
    while(res == 10000);
    return res;
}
