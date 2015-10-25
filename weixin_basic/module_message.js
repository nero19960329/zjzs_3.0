//var at = require('../weixin_basic/access_token');
//var module_message = require('../weixin_basic/module_message');
//at.getAccessToken(module_message.sendModuleMessage);

var http = require('https');

exports.sendModuleMessage = function (access_token) {

    var data = {
        "touser":"oKjmTv4XoAgwFsrDKdYpH_5ci8mE",
        "template_id":"oDxo9mhnI4wcF2Rxhsneb9jFVKgVz7QkfqJZ1hgIzck",
        "url":"",
        "topcolor":"#FF0000",
        "data":{
        	"first":{
        		"value":"rp",
        		"color":"#173177"
        	},
        	"guess":{
        		"value":"不",
        		"color":"#173177"
        	}
        }
    };

    data = JSON.stringify(data);
    //console.log(data);
    var opt = {
		hostname: 'api.weixin.qq.com',
		port: '443',
		path: '/cgi-bin/message/template/send?access_token='+access_token,
		method: 'POST'
    };
    //console.log(opt.path);

    var req = http.request(opt, function (res) {
        res.on('data', function (data) {
        	//process.stdout.write(data);
        	console.log(data);
        })
    });
    req.write(data);
    req.end();
}