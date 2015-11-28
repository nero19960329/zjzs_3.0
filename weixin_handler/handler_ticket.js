var template = require('./reply_template');
var model = require('../models/models');
var lock = require('../models/lock');
var urls = require("../address_configure");
var checker = require("./checkRequest");
var basicInfo = require("../weixin_basic/settings.js");

//Attentez: keep the activity::key unique globally.
var TICKET_DB = model.tickets;
var USER_DB = model.students;
var ACTIVITY_DB = model.activities;
var SEAT_DB = model.seats;
var REQUEST_DB = model.requests;
var db = model.db;

var alphabet = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";

var act_cache={};
var usr_lock={};

exports.clearCache=function()
{
    act_cache={};
}

function verifyStudent(openID,ifFail,ifSucc)
{
    console.log("openID: " + openID);
    db[USER_DB].find({weixin_id:openID,status:1},function(err,docs)
    {
        if (err || docs.length==0)
        {
            ifFail();
            return;
        }
        ifSucc(docs[0].stu_id, docs[0].punish);
    });
}
exports.verifyStu=verifyStudent;
function verifyActivities(actKey,ifFail,ifSucc)
{
    var timer = new Date();
    var current=timer.getTime();
    var theAct=act_cache[actKey];
    if (theAct)
    {
        if (current<theAct.book_end)
        {
            if (current>theAct.book_start)
            {
                ifSucc(theAct._id,theAct);
                return;
            }
            ifFail(theAct.book_start-current);
            return;
        }
        act_cache[actKey]=null;
        ifFail();
        return;
    }
    db[ACTIVITY_DB].find(
    {
        key:actKey,
        book_end:{$gt:current},
        status:1
    },function(err,docs)
    {
        if (err || docs.length==0)
        {
            ifFail();
            return;
        }
        act_cache[actKey]=docs[0];
        if (current>docs[0].book_start)
        {
            ifSucc(docs[0]._id,docs[0]);
            return;
        }
        else
        {
            ifFail(docs[0].book_start-current);
            return;
        }
    });
}
function getRandomString()
{
    var ret="";

    for (var i=0;i<13;i++)
        ret+=alphabet[Math.floor(Math.random()*alphabet.length)];
    return ret;
}
function presentTicket(msg,res,tick,act)
{
    var tmp="恭喜，抢票成功！\n";
    tmp+=template.getHyperLink("点我查看电子票",urls.ticketInfo+"?ticketid="+tick.unique_id);
    if (act.need_seat!=0)
        tmp+="\n注意:该活动需在抢票结束前选座(区)，请进入电子票选择。";
    res.send(template.getPlainTextTemplate(msg,tmp));
}

function getTimeFormat(timeInMS)
{
    var sec=Math.floor(timeInMS/1000);
    var min=Math.floor(sec/60);
    var hou=Math.floor(min/60);

    sec-=min*60;
    min-=hou*60;
    if (hou+min+sec==0)
        return "1秒";
    return (hou>0?hou+"小时":"")+(min>0?min+"分":"")+(sec>0?sec+"秒":"");
}

function needValidateMsg(msg) {
  return template.getPlainTextTemplate(msg,'<a href="' + urls.validateAddress
    + '?openid=' + msg.FromUserName +  '">请先点我绑定学号。</a>');
}

exports.check_get_ticket=function(msg)
{
    if (checker.checkMenuClick(msg).substr(0,basicInfo.WEIXIN_BOOK_HEADER.length)===basicInfo.WEIXIN_BOOK_HEADER)
        return true;
    if (msg.MsgType[0]==="text")
        if (msg.Content[0]==="抢票" || msg.Content[0].substr(0,3)==="抢票 ")
            return true;
    return false;
}

exports.save_ticket_request = function(msg, res) {
    var weixin_id, act_name, current_time;

    if (msg.MsgType[0]==="text") {
        if (msg.Content[0]==="抢票") {
            res.send(template.getPlainTextTemplate(msg,"请使用“抢票 活动代称”的命令或菜单按钮完成指定活动的抢票。"));
            return;
        } else {
            act_name=msg.Content[0].substr(3);
        }
    } else {
        act_name=msg.EventKey[0].substr(basicInfo.WEIXIN_BOOK_HEADER.length);
    }
    
    verifyActivities(act_name, function(tl) {
    	if (tl == null){
    		res.send(template.getPlainTextTemplate(msg, "目前没有符合要求的活动处于抢票期。"));
    	} else {
    		res.send(template.getPlainTextTemplate(msg, "该活动将在 " + getTimeFormat(tl) + " 后开始抢票，请耐心等待！"));
    	}
    }, function(actID, staticACT) { // 可以对verifyActivities进行代码优化
		weixin_id = msg.FromUserName[0];
		current_time = (new Date()).getTime();

		db[REQUEST_DB].insert({
		    weixin_id : weixin_id,
		    act_name : act_name,
		    time : current_time,
		    type: 0		// 0代表抢票，1代表退票成功
		}, function(err, result) {
		    res.send(template.getPlainTextTemplate(msg,"您的抢票请求正在处理中，请稍后查看抢票结果(/▽＼)"));
		});
    });
}
//========================================
exports.check_reinburse_ticket=function(msg)
{
    if (msg.MsgType[0]==="text")
        if (msg.Content[0]==="退票" || msg.Content[0].substr(0,3)==="退票 ")
            return true;
    return false;
}
exports.faire_reinburse_ticket=function(msg,res)
{
    var actName,openID;
    if (msg.Content[0]==="退票")
    {
        //WARNING: Fill the activity name!!
        res.send(template.getPlainTextTemplate(msg,"请使用“退票 活动代称”的命令完成指定活动的退票。"));
        return;
    }
    else
    {
        actName=msg.Content[0].substr(3);
    }

    openID=msg.FromUserName[0];
    verifyStudent(openID,function()
    {
        //WARNING: may change to direct user to bind
        res.send(needValidateMsg(msg));
    },function(stuID)
    {
        verifyActivities(actName,function()
        {
            res.send(template.getPlainTextTemplate(msg,"目前没有符合要求的活动处于退票期。"));
        },function(actID)
        {
            db[TICKET_DB].findAndModify(
            {
                query: {stu_id:stuID,activity:actID,status:1},
                update: {$set: {status:0}}
            },function(err,result)
            {
                if (err || result==null)
                {
                    res.send(template.getPlainTextTemplate(msg,
                        "未找到您的抢票记录或您的票已经支付，退票失败。如为已支付票，请联系售票机构退还钱款后退票。"));
                    return;
                }
                if (result.seat!="" && result.seat!=null)
                {
                    var incIndex={};
                    incIndex[result.seat]=1;
                    db[SEAT_DB].update({activity:actID},
                    {
                        $inc: incIndex
                    },function()
                    {
                        //Nothing? Oui, ne rien.
                    });
                }
                    
            	var current_time = (new Date()).getTime();
           		db[REQUEST_DB].insert({
				weixin_id : stuID,
					act_name : actName,
					time : current_time,
					type: 1		// 0代表抢票，1代表退票成功
				}, function(err, result) {
					res.send(template.getPlainTextTemplate(msg,"退票成功"));
				});
            });
        });
    });
}
//========================================
exports.check_list_ticket=function(msg)
{
    if (msg.MsgType[0]==="text")
        if (msg.Content[0]==="查票")
            return true;
    if (checker.checkMenuClick(msg)===basicInfo.WEIXIN_EVENT_KEYS['ticket_get'])
        return true;
    return false;
}
function renderTicketList(oneTicket,oneActivity,isSingle)
{
    var ret={};

    if (isSingle)
    {
        //Attentez: notify the user to select seat.
        ret[template.rich_attr.title]="抢票成功！";
        ret[template.rich_attr.description]=oneActivity.name;
    }
    else
        ret[template.rich_attr.title]=oneActivity.name;
    ret[template.rich_attr.url]=urls.ticketInfo+"?ticketid="+oneTicket.unique_id;
    ret[template.rich_attr.picture]=oneActivity.pic_url;

    return ret;
}
exports.faire_list_ticket=function(msg,res)
{
    var openID;

    openID=msg.FromUserName[0];
    verifyStudent(openID,function()
    {
        //WARNING: may change to direct user to bind
        res.send(needValidateMsg(msg));
    },function(stuID)
    {
        db[TICKET_DB].find(
        {
            stu_id:stuID,
            $or:[{status:1},{status:2}]
        },function(err,docs)
        {
            if (err || docs.length==0)
            {
                res.send(template.getPlainTextTemplate(msg,"没有找到属于您的票哦，赶快去抢一张吧！"));
                return;
            }
            var actList=[];
            var actMap={};
            var list2Render=[];
            for (var i=0;i<docs.length;i++)
            {
                actList.push({_id:docs[i].activity});
            }
            db[ACTIVITY_DB].find(
            {
                $or: actList
            },function(err1,docs1)
            {
                if (err1 || docs1.length==0)
                {
                    res.send(template.getPlainTextTemplate(msg,"出错了 T T，稍后再试。"));
                    return;
                }
                //WARNING: what if tickets>=WEIXIN_LIMIT?
                for (var i=0;i<docs1.length;i++)
                {
                    actMap[docs1[i]._id]=docs1[i];
                }

                var tmpEle;
                tmpEle={};
                tmpEle[template.rich_attr.title]="\n我的票夹\n";
                tmpEle[template.rich_attr.description]=
                    "以下列表中是您抢到的票。(如果超过9个则可能有省略)";

                list2Render.push(tmpEle);
                for (var i=0;i<docs.length;i++)
                {
                    list2Render.push(renderTicketList(docs[i],actMap[docs[i].activity],false));
                }
                res.send(template.getRichTextTemplate(msg,list2Render));
            });
        });
    });
}
