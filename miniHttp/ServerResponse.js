var outgoingMessage = require('./OutgoingMessage');
var util = require('util');


util.inherits(ServerResponse, outgoingMessage);

function ServerResponse(req, opt) {
	var that = this;
	that.request = req;
	outgoingMessage.call(req.connection, opt);
	that.socket = req.connection;
	that.statusCode = 200;
	that.headersSent = false;
	that.sendDate = true;
	that.headers = {};
	that.closeConnection = false;
	if (req.headers["connection"] === "close" ||
			(req.httpVersion == 1.0 && req.headers["connection"]!=="keep-alive")) {
		that.closeConnection = true;
	}


}

ServerResponse.prototype.STATUS_CODES = {
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

ServerResponse.prototype.writeHead = function (statusCode, reasonPhrase, headers) {
	var that = this;
	var headersStr = "HTTP/1.1 ";
	// add status to initial line
	if(!reasonPhrase || (reasonPhrase && typeof reasonPhrase !== 'string')) {
		headers = reasonPhrase;
		reasonPhrase = that.STATUS_CODES[statusCode.toString()];
	}
	headersStr += statusCode.toString() + " " + reasonPhrase + "\r\n";

	// add date header
	if (that.sendDate) {
		headersStr += "Date: " + Date() + "\r\n";
	}

	if (headers) {
		Object.keys(headers).forEach(function (key) {
			if (headers[key] instanceof Array) {
				// this is an array of objects, like in set-cookie
				headers[key].forEach(function(val) {
					headersStr += key + ": " + val + "\r\n";
				});
			}
			else {
				headersStr += key + ": " + headers[key] + "\r\n";
			}
		});
	}

	if (["500", "505"].indexOf(statusCode.toString()) !== -1) {
		that.closeConnection = true;
	}

	// connection
	headersStr += makeConnectionHeader(that.request.httpVersion, that.closeConnection);
	

	headersStr += "\r\n";
	that.headersSent = true; // set headers as sent before sending them
							 // (so that while writing no one would call this method again)
	that._write(headersStr, function (err) {
		if (err) {
			console.log("error sending headers");
			that.headersSent = false; //the werent sent well yet
			return;
		}
		
	});
	
};


/*var makeContentTypeHeader = function (req) {
	if (req.headers["content-type"] !== undefined) {
		return "Content-Type: " + req.headers["content-type"] + "\r\n";
	}
	else {
		// get content type out of file name
		var fileType = req.url.split('.');
		fileType = fileType[fileType.length - 1];
		switch (fileType.toLowerCase()) {
			case "js":
				fileType = "application/javascript";
				break;
			case "htm":
			case "html":
				fileType = "text/html";
				break;
			case "css":
				fileType = "text/css";
				break;
			case "jpg":
			case "jpeg":
				fileType = "image/jpeg";
				break;
			case "gif":
				fileType = "image/gif";
				break;
			case "png":
				fileType = "image/png";
				break;
			default:
				fileType = "text/plain";
		}
		return "Content-Type: " + fileType + "\r\n";
	}
};
*/
var makeConnectionHeader = function (httpVer, toCloseConnection) {
	if (toCloseConnection) {// && httpVer !== "1.0") {
		return "Connection: close\r\n";
	}
	if (!toCloseConnection && httpVer === "1.0") {
		return "Connection: keep-alive\r\n";
	}
	return "";
};

module.exports = ServerResponse;