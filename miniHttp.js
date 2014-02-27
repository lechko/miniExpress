var server = require('./miniHttp/Server');

exports.STATUS_CODES = {
	'100': 'Continue',
	'200': 'OK',
	'201': 'Created',
	'304': 'Not Modified',
	'400': 'Bad Request',
	'404': 'Not Found',
	'405': 'Method Not Allowed',
	'408': 'Request Time-out',
	'415': 'Unsupported Media Type',
	'431': 'Request Header Fields Too Large',
	'500': 'Internal Server Error',
	'505': 'HTTP Version Not Supported'
};

exports.createServer = function (requestListener) {
	var s = new server();
	if (requestListener instanceof Function) {
		s.on('request', requestListener);
	}
	return s;
};


/* TODO
exports.request = function (options, callback) {
	if (typeof options === "string") {
		options = url.parse(options);
	}
	// we send a request (only headers so far), which returns the ClientRequest object that
	// we can listen to events on. when we get back the response headers, we use the callback with
	// a response object, and we can listen to events on such object (such as wait for the body) using
	// .on('data').
	// as it seems, we can wait until sending for the req.end(), but lets wait until we understand this method.
};

exports.get = function (options, callback) {

};

*/