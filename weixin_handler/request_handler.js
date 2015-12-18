var at = require('../weixin_basic/access_token');
var moduleMsg = require('../weixin_basic/module_message');
var model = require('../models/models');
var handlerTicket = require('../weixin_handler/handler_ticket');

var REQUEST_DB = model.requests;
var TICKET_DB = model.tickets;
var USER_DB = model.students;
var ACTIVITY_DB = model.activities;
var SEAT_DB = model.seats;
var db = model.db;
//at.getAccessToken(module_message.sendSuccessMessage);

var alphabet = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";

var tik_cache = {};
var req_cache = new Array();
var stu_cache = {};

var run_times = 0;

var time_1 = (new Date()).getTime();
var time_2;

handleSingleActivity();

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

exports.handleSingleActivity = handleSingleActivity;
function handleSingleActivity() {
	run_times++;
    if (req_cache.length === 0) {
        db[REQUEST_DB].find({}, {sort:{time:-1}}, function(err, docs) {
            if (err || docs.length == 0) {
                //nobody want this activity
                stu_cache = {};
                //console.log('stu_cache: {}');
                //300000 in use;1000 in test
                time_2 = (new Date()).getTime();
                setTimeout(handleSingleActivity, 5000);
                return -1;
            }
            req_cache = docs;
            handleSingleActivity();
        });
    } else {
        var req = req_cache[req_cache.length-1];
        --req_cache.length;
        //console.log("req_cache.length: " + req_cache.length);
		db[REQUEST_DB].remove({_id:req._id});
        
        var remain_tickets = 0;
        var activityName = "";
        var activityTime = "";
        var activityPos = "";
        var activity_id = 0;
        var name = req.act_name;
        db[ACTIVITY_DB].find({key:name}, function(err2, docs2){
            if (err2 || docs2.length==0) {
                //no activity
                return -1;
            }
            if (tik_cache[name] == null){
                tik_cache[name] = {};
                tik_cache[name].tikMap = {};
            }
            if (stu_cache[name] == null) {
            	stu_cache[name] = {};
            	stu_cache[name].tikMap = {};
            }
            
            //console.log('stu_cache: ');
            //for (var attr in stu_cache[name].tikMap) {
            //	console.log(attr + ': ' + stu_cache[name].tikMap[attr]);
            //}
            
            remain_tickets = docs2[0].remain_tickets;
            if (req.type == 1){//退票成功
                remain_tickets += 1;
                db[ACTIVITY_DB].update({key:name}, {$set:{remain_tickets:remain_tickets}});
                handleSingleActivity();
                return;
            }
            
            var openid = req.weixin_id;
            distributeTicket(openid, docs2[0], remain_tickets, function() {
            	handleSingleActivity();
            });
        });
    }
}

//return errnum 0:avaliable 1: 2: 3: ...
// <0: punished value
// 0 : ticket avaliable
// 1 : haven't validated
// 2 : already get ticket
// 3 : db errors
// 4 : no more ticket
function distributeTicket(openid, staticACT, remain_tickets, callback){
    var name = staticACT.key;
    db[USER_DB].find({weixin_id:openid, status:1}, function(err3, docs3){
        if (err3){
            at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : 3}, staticACT, callback);
        }else if(docs3.length == 0){
            if(stu_cache[name].tikMap[openid] != true)
            {
                stu_cache[name].tikMap[openid] = true;
                at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : 1}, staticACT, callback);
            }
            else{
            	callback();
            }
        }else if (docs3[0].punish > 0){
            if(stu_cache[name].tikMap[openid] != true)
            {
                stu_cache[name].tikMap[openid] = true;
                at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : -docs3[0].punish}, staticACT, callback);
            }
            else{
            	callback();
            }
        }else{
            db[TICKET_DB].find({stu_id:docs3[0].stu_id, activity:staticACT._id, status:1}, function(err4, docs4){
                if (err4){
                    at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : 3}, staticACT, callback);
                }else if (docs4.length == 0){
            		if (remain_tickets > 0){
                        remain_tickets--;
                        db[ACTIVITY_DB].update({key:staticACT.key}, {$set:{remain_tickets:remain_tickets}}, function(err100, count){
                            stu_cache[name].tikMap[openid] = true;
    		                var stuID = docs3[0].stu_id;
    		                var ss = staticACT._id.toString();
    		                var tiCode = generateUniqueCode(ss.substr(0,8)+ss.substr(14),staticACT.key);
    		                var price = 0;
    		                if(staticACT.need_seat == 2){
    		                    price = parseInt(staticACT.price);
    		                }
                            //console.log("stu_id: " + stuID);
    		                db[TICKET_DB].insert(
    		                {
    		                    stu_id:     stuID,
    		                    unique_id:  tiCode,
    		                    activity:   staticACT._id,
    		                    status:     1,
    		                    seat:       "",
    		                    cost:       price
    		                }, function(err101, count) {
            					at.getAccessTokenValue(moduleMsg.sendSuccessMessage, openid, tiCode, staticACT, callback);
            				});
                        });
                    }
            		else{
				        // no more tickets
                        if(stu_cache[name].tikMap[openid] != true)
                        {
                            stu_cache[name].tikMap[openid] = true;
				            at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : 4}, staticACT, callback);
                        }
						else{
							callback();
						}
            		}
                }else{
                    if(stu_cache[name].tikMap[openid] != true)
                    {
                    	stu_cache[name].tikMap[openid] = true;
                        at.getAccessTokenValue(moduleMsg.sendFailMessage, openid, {errcode : 2, ticketid : docs4[0].unique_id}, staticACT, callback);
                    }
				    else{
				    	callback();
				    }
                }
            });
        }
    });
}
