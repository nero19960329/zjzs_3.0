var sweeper = require('../../models/sweeper');
//var requestHandler = require('../../weixin_handler/request_handler');
var basicInfo = require('../../weixin_basic/settings');
var models = require('../../models/models')
    , db = models.db;
var should = require('should');
var sinon = require('sinon');
var util = require('../util');


describe('unit test', function () {
    before(function(done) {
        util.clearData(function(err) {
            if (err != null) done(err);
            util.loadStudent(function(err) {
                if (err != null) done(err);
                util.loadActivity(done);
                util.loadTickets(done);
            });
        });
    });
    
    describe('models/sweeper', function () {
        describe('#wipeActivity', function () {
            db[models.activities].update({key:"simple"},{$set:{end_time:0}}, function(){
            	sweeper(function(){
            	     db[models.students].find({}, function(err, docs){
            	     	var length =  docs.length;
            	     	for(var i = 0; i < length; i++){
            	     	    if (docs[i].weixin_id = "student4"){
            	     	    	should(docs[i].punish).eq(0);
            	     	    	should(docs[i].credits).eq(0);
							}else if (docs[i].weixin_id = "student5"){
            	     	    	should(docs[i].punish).eq(1);
            	     	    	should(docs[i].credits).eq(0);
							}else if (docs[i].weixin_id = "student6"){
            	     	    	should(docs[i].punish).eq(5);
            	     	    	should(docs[i].credits).eq(0);
							}else if (docs[i].weixin_id = "student7"){
            	     	    	should(docs[i].punish).eq(0);
            	     	    	should(docs[i].credits).eq(1);
							}
            	     	}
            	     });
            	});
            });
        });
        
    });
});
