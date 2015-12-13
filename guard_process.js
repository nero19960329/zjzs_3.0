var spawn = require('child_process').spawn;
var requestHandler = null;

exports.startRequestHandler = startRequestHandler;

function startRequestHandler() {
	console.log('start ok! ' + (new Date()));
	requestHandler = spawn('node', ['./weixin_handler/request_handler.js']);
	requestHandler.on('close', function(code, signal) {
		console.log('close! restarting. . .');
		requestHandler.kill(signal);
		requestHandler = startRequestHandler();
	});
	requestHandler.on('error', function(code, signal) {
		console.log('error! restarting. . .');
		requestHandler.kill(signal);
		requestHandler = startRequestHandler();
	});
	return requestHandler;
}
