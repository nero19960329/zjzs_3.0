var handlerTicket = require('../../weixin_handler/handler_ticket');
var requestHandler = require('../../weixin_handler/request_handler');
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
            });
        });
    });
    describe('weixin_handler/handler_ticket', function () {
        function generator(testCase, func) {
            testCase.check = testCase.check || function () {
                };
            if (testCase.check.length == 0)
                return function () {
                    should(func.apply(this, testCase.args)).eql(testCase.return);
                    testCase.check();
                };
            else return function (done) {
                should(func.apply(this, testCase.args)).eql(testCase.return);
                testCase.check(done);
            }
        }

        describe('#verifyStu', function () {

            it('should fail with non exist weixin id', function (done) {
                var ifFail = function () {
                    done();
                };
                var ifSuccess = function () {
                    done("should not called");
                };
                handlerTicket.verifyStu('nonexist', ifFail, ifSuccess);
            });

            it('should success with exist weixin id', function (done) {
                var ifFail = function () {
                    done("should not called");
                };
                var ifSuccess = function (studentId) {
                    should(studentId).be.a.String.and.eql('2014311933');
                    done();
                };
                handlerTicket.verifyStu('student1', ifFail, ifSuccess);
            });
        });

        describe('#check_get_ticket', function () {
            var testSuit = {
                'should not be pattern-matched anyway.': {
                    args: [{
                        MsgType: []
                    }],
                    return: false
                },
                'should return true for menu click': {
                    args: [{
                        MsgType: ['event'],
                        Event: ['CLICK'],
                        EventKey: [basicInfo.WEIXIN_BOOK_HEADER]
                    }],
                    return: true
                },
                'should return true for text qiangpiao': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['抢票']
                    }],
                    return: true
                },
                'should return true for text qiangpiao as sub string': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['抢票 haha']
                    }],
                    return: true
                }
            };

            for (var description in testSuit) {
                it(description, generator(testSuit[description], handlerTicket.check_get_ticket));
            }
        });

        describe('#save_ticket_request', function () {
            var send = sinon.stub();
            send.returnsArg(0);

            var EventEmitter = require('events').EventEmitter;
            var sendAsyncCallStub = new EventEmitter();
            sendAsyncCallStub.stub = function (msg) {
                setImmediate(function () {
                    sendAsyncCallStub.emit('called');
                });
                return msg;
            };
            var stubSpy = sinon.spy(sendAsyncCallStub, 'stub');

            beforeEach(function () {
                stubSpy.reset();
                sendAsyncCallStub.removeAllListeners();
            });
            
            var testSuit = {
                'should send 请使用“抢票 活动代称”的命令或菜单按钮完成指定活动的抢票。': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票'],
                            FromUserName: ['student0'],
                            ToUserName: ['to']
                        },
                        {
                            send: send
                        }
                    ],
                    check: function () {
                        should(send.callCount).be.eql(1);
                        should(send.firstCall.returnValue).be.a.String.and.match(/请使用“抢票 活动代称”的命令或菜单按钮完成指定活动的抢票。/);
			
                    }
                },
                'should send 请先绑定学号。 for nonexist from user': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student0'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                        		should(errcode.errcode).be.eql(1);
                        		callback();
								done();
			    			};
			    			var ifSuccess = function (token, openid, ticketid, act, callback) {
			    				callback();
								done("should not called");
			    			};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 目前没有符合要求的活动处于抢票期。': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 haha'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/目前没有符合要求的活动处于抢票期。/);
                            done();
                        });
                    }
                },
                'should send 后开始抢票，请耐心等待！': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 not_start'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/后开始抢票，请耐心等待！/);
                            done();
                        });
                    }
                },
                'should send 恭喜，抢票成功！': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                            	callback();
								done("should not called");
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								should(openid).be.eql("student1");
								callback();
								done();
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 你已经有票啦，请用查票功能查看抢到的票吧！': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                        		should(errcode.errcode).be.eql(2);
                        		callback();
								done();
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done("should not called");
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 由于以前的不良抢票记录，账号被冻结。punish once': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student4'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                        		should(errcode.errcode).be.eql(-1);
                        		callback();
								done();
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done("should not called");
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 由于以前的不良抢票记录，账号被冻结。punish twice': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student5'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                        		should(errcode.errcode).be.eql(-2);
                        		callback();
								done();
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done("should not called");
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 恭喜，抢票成功！ near punish': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student6'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                            	callback();
								done("should not called");
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done();
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 恭喜，抢票成功！ normal': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 simple'],
                            FromUserName: ['student7'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                            	callback();
								done("should not called");
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done();
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                },
                'should send 对不起，票已抢完': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['抢票 no_ticket'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function () {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            var ifFail = function (token, openid, errcode, act, callback) {
                        		should(errcode.errcode).be.eql(4);
                        		callback();
								done();
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								done("should not called");
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        });
                    }
                }
            };
            for (var des in testSuit) {
                it(des, generator(testSuit[des], handlerTicket.save_ticket_request));
            }

            function get_ticket(student, activity) {
                handlerTicket.save_ticket_request({
                        MsgType: ['text'],
                        Content: ['抢票 '+ activity ],
                        FromUserName: [student],
                        ToUserName: ['to']
                    },
                    {
                        send: sendAsyncCallStub.stub
                    });
            }
            describe('race condition testing', function() {
                it('should deliver one ticket on race condition', function (done) {
                    get_ticket('student2', 'race');
                    sendAsyncCallStub.on('called', function () {
                        should(stubSpy.callCount).be.above(0);
                        //console.log(stubSpy.callCount);
                        if (stubSpy.callCount === 2) {
                            should(stubSpy.secondCall.returnValue).be.a.String.and.match(/处理中/);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            /*db[models.tickets].find({$or: [{stu_id:"2014311934"}, {stu_id:"2014311933"}]}, function(err, docs) {
                                if (err) done(err);
                                should(docs.length).be.eql(0);
                            });*/
                            var failtimes = 0;
                            var succtimes = 0;
                            var ifFail = function (token, openid, errcode, act, callback) {
								failtimes++;
								should(failtimes).be.below(2);
								callback();
								if(failtimes + succtimes == 2) done();
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								succtimes++;
								should(succtimes).be.below(2);
								callback();
								db[models.tickets].find({$or: [{stu_id:"2014311934"}, {stu_id:"2014311935"}]}, function(err, docs) {
									if (err) done(err);
									should(docs.length).be.eql(1);
									if(failtimes + succtimes == 2) done();
								});
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        }
                        else{
                            get_ticket('student3', 'race');
                        }
                    });
                });
                it('should deliver one ticket on race condition for single people', function (done) {
                    get_ticket('student8', 'race_single');
                    sendAsyncCallStub.on('called', function () {
                        should(stubSpy.callCount).be.above(0);
                        if (stubSpy.callCount === 2) {
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/处理中/);
                            should(stubSpy.secondCall.returnValue).be.a.String.and.match(/处理中/);
                            /*db[models.tickets].find({stu_id:"2014311933"}, function(err, docs) {
                                if (err) done(err);
                                should(docs.length).be.eql(1);
                            });*/
                            var ifFail = function (token, openid, errcode, act, callback) {
                            	callback();
                            	done("should not called");
							};
							var ifSuccess = function (token, openid, ticketid, act, callback) {
								callback();
								db[models.tickets].find({stu_id:"2014311940"}, function(err, docs) {
									if (err) done(err);
									should(docs.length).be.eql(1);
									done();
								});
							};
                            requestHandler.handleSingleActivity(ifSuccess, ifFail);
                        }
                        else{
                    	    get_ticket('student8', 'race_single');
                        }
                    });
                });
                /*
                it('should not insert two ticket with same unique id', function(done) {
                    var cache = Math.random;
                    var floorStub = sinon.stub(Math, 'random');
                    for(var i = 0; i < 64; i++) floorStub.onCall(i).returns(0);
                    floorStub.returns(cache());
                    get_ticket('student2', 'stub_floor');
                    get_ticket('student3', 'stub_floor');
                    sendAsyncCallStub.on('called', function () {
                        should(stubSpy.callCount).be.above(0);
                        if (stubSpy.callCount === 2) {
                            should(stubSpy.secondCall.returnValue).be.a.String.and.match(/您的抢票请求正在处理中，请稍后查看抢票结果/);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/您的抢票请求正在处理中，请稍后查看抢票结果/);
                            db[models.activities].find({key: 'stub_floor'}, function(err, docs) {
                                if (err) done(err);
                                should(docs.length).be.eql(0);
                                db[models.tickets].find({activity: docs[0]._id}, function(err, docs) {
                                    if (err) done(err);
                                    should(docs.length).be.eql(0);
                                    should(docs[0].unique_id).not.be.eql(docs[1].unique_id);
                                    done();
                                });
                            });
                        }
                    });
                });*/
            });

        });
	
        describe('#check_list_ticket', function() {
            var testSuit = {
                'should return false for non text type': {
                    args: [{
                        MsgType: ['event'],
                        Event: ['CLICK'],
                        EventKey: ['key']
                    }],
                    return: false
                },
                'should return true for text 查票': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['查票']
                    }],
                    return: true
                },
                'should return true for menu ticket get': {
                    args: [{
                        MsgType: ['event'],
                        Event: ['CLICK'],
                        EventKey: [basicInfo.WEIXIN_EVENT_KEYS['ticket_get']]
                    }],
                    return: true
                }
            };
            for (var description in testSuit) {
                it(description, generator(testSuit[description], handlerTicket.check_list_ticket));
            }
        });
        console.log("shit");
	//requestHandler.handleSingleActivity();
	
        describe('#faire_list_ticket', function() {
            var send = sinon.stub();
            send.returnsArg(0);

            var EventEmitter = require('events').EventEmitter;
            var sendAsyncCallStub = new EventEmitter();
            sendAsyncCallStub.stub = function (msg) {
                setImmediate(function () {
                    sendAsyncCallStub.emit('called');
                });
                return msg;
            };
            var stubSpy = sinon.spy(sendAsyncCallStub, 'stub');

            beforeEach(function () {
                stubSpy.reset();
                sendAsyncCallStub.removeAllListeners();
            });
            var testSuit = {
                'should send 请先绑定学号。': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['查票'],
                            FromUserName: ['from'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/请先点我绑定学号/);
                            done();
                        });
                    }
                },
                'should send 没有找到属于您的票哦': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['查票'],
                            FromUserName: ['student9'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/没有找到属于您的票哦/);
                            done();
                        });
                    }
                },
                'should send ticket list': {
                    args: [
                        {
                            MsgType: ['text'],
                            Content: ['查票'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function (done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/ticketsinfo/);
                            done();
                        });
                    }
                }
            };
            for(var des in testSuit) {
                it(des, generator(testSuit[des],handlerTicket.faire_list_ticket));
            }

        });

        describe('#check_reinburse_ticket', function() {
            var testSuit = {
                'should return false if not text': {
                    args: [{
                        MsgType: ['event']
                    }],
                    return: false
                },
                'should return false if not tuipiao': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['haha']
                    }],
                    return: false
                },
                'should return true if tuipiao': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['退票']
                    }],
                    return: true
                },
                'should return true if tuipiao with activity': {
                    args: [{
                        MsgType: ['text'],
                        Content: ['退票 haha']
                    }],
                    return: true
                }
            };
            for(var des in testSuit) {
                it(des, generator(testSuit[des], handlerTicket.check_reinburse_ticket));
            }
        });

        describe('#faire_reinburse_ticket', function() {
            var send = sinon.stub();
            send.returnsArg(0);

            var EventEmitter = require('events').EventEmitter;
            var sendAsyncCallStub = new EventEmitter();
            sendAsyncCallStub.stub = function (msg) {
                setImmediate(function () {
                    sendAsyncCallStub.emit('called');
                });
                return msg;
            };
            var stubSpy = sinon.spy(sendAsyncCallStub, 'stub');

            beforeEach(function () {
                stubSpy.reset();
                sendAsyncCallStub.removeAllListeners();
            });

            var testSuit = {
                'should use command with activity': {
                    args: [
                        {
                            Content: ['退票'],
                            FromUserName: ['from'],
                            ToUserName: ['to']
                        },
                        {
                            send: send
                        }
                    ],
                    check: function() {
                        should(send.callCount).be.eql(1);
                        should(send.firstCall.returnValue).be.a.String.and.match(/请使用“退票 活动代称”的命令完成指定活动的退票。/);
                    }
                },
                'should send 请先绑定学号。': {
                    args: [
                        {
                            Content: ['退票 haha'],
                            FromUserName: ['from'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function(done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/请先点我绑定学号/);
                            done();
                        });
                    }
                },
                'should send 目前没有符合要求的活动处于退票期。': {
                    args: [
                        {
                            Content: ['退票 haha'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function(done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/目前没有符合要求的活动处于退票期。/);
                            done();
                        });
                    }
                },
                'should send 未找到您的抢票记录或您的票已经支付': {
                    args: [
                        {
                            Content: ['退票 race'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function(done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/未找到您的抢票记录或您的票已经支付，退票失败。如为已支付票，请联系售票机构退还钱款后退票。/);
                            done();
                        });
                    }
                },
                'should send 退票成功。': {
                    args: [
                        {
                            Content: ['退票 simple'],
                            FromUserName: ['student1'],
                            ToUserName: ['to']
                        },
                        {
                            send: sendAsyncCallStub.stub
                        }
                    ],
                    check: function(done) {
                        sendAsyncCallStub.on('called', function() {
                            should(stubSpy.callCount).be.eql(1);
                            should(stubSpy.firstCall.returnValue).be.a.String.and.match(/退票成功/);
                            done();
                        });
                    }
                }
            };
            for(var des in testSuit) {
                it(des, generator(testSuit[des],handlerTicket.faire_reinburse_ticket));
            }

        });
    });
});
