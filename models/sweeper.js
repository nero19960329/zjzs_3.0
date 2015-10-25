var model = require('../models/models');

var TICKET_DB = model.tickets;
var ACTIVITY_DB = model.activities;
var USER_DB = model.students;
var db = model.db;

function wipeActivity(actID,callback)
{
    //db[TICKET_DB].update({activity:actID}, {$set:{status:4}}, false, true);
    db[ACTIVITY_DB].update({_id:actID},
    {
        $set: {status:99}
    },{multi:false},function()
    {
        db[TICKET_DB].find(
        {
            activity:actID,
            status:1
        }, function(err, docs){
            if (err | docs.length == 0){
                //
            }
            else
            {
                var length = docs.length
                for (var i = 0; i < length; i++){
                    var doc = docs[i];
                    db[USER_DB].find({stu_id:doc.stu_id}, function(err2, docs2)
                    {
                        if (err2 | docs2.length == 0){
                            //
                        }
                        else
                        {
                            db[USER_DB].update({stu_id:doc.stu_id}, {$set:{credits:parseInt(docs2[0].credits)+1}});
                            if (parseInt(docs2[0].credits)+1 >= 3){
                                db[USER_DB].update({stu_id:doc.stu_id}, {$set:{punish:5, credits:0}});
                            }
                        }
                    })
                }
            }
        })
        db[USER_DB].find(
        {
            punish:{$gt: 0}
        }, function(err, docs){
            if (err | docs.length == 0){
                //
            }
            else
            {
                var length = docs.length
                for (var i = 0; i < length; i++){
                    var doc = docs[i];
                    db[USER_DB].find({stu_id:doc.stu_id}, function(err2, docs2)
                    {
                        if (err2 | docs2.length == 0){
                            //
                        }
                        else
                        {
                            if (parseInt(docs2[0].punish) > 0)
                                db[USER_DB].update({stu_id:doc.stu_id}, {$set:{punish:parseInt(docs2[0].punish)-1}});
                        }
                    })
                }
            }
        })
        db[TICKET_DB].update(
        {
            activity:actID,
            $or:[{status:1},{status:2},{status:3}]
        },
        {
            $set: {status:99}
        },{multi:true},function()
        {
            console.log("+++++Wipe out one ACTIVITY SUCCESSFULLY+++++");
            callback();
        });
    });
}

function genericWiper(callback)
{
    var current=(new Date()).getTime();
    db[ACTIVITY_DB].find(
    {
        status:1,
        end_time:{$lt:current}
    },function(err,docs)
    {
        if (err || docs.length==0)
        {
            callback();
            return;
        }
        var t=0;
        for (var i=0;i<docs.length;i++)
        {
            wipeActivity(docs[i]._id,function()
            {
                t++;
                if (t==docs.length)
                    callback();
            });
        }
    });
}

module.exports = genericWiper;
