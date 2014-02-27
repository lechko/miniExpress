var readable = require('stream').Readable;
var util = require('util');

util.inherits(IncomingMessage, readable);

function IncomingMessage(socket, opt) {
	var that = this;
	readable.call(this, opt);
	that.socket = socket;
	that.connection = socket; // to comply with http://nodejs.org/api/http.html#http_event_connection
	
	that.httpVersion = undefined;
	that.headers = {};
	that.trailers = {}; // currently unsupported
	that.method = undefined;
	that.url = undefined;
	that.statusCode = undefined;
	that.remaining = 0; // remaining body-bytes to read for this request
	that.error = undefined;
	

	// socket remains open while messages are reformed. 
	// we must remove previous emitters to prevent memory leak.
	that.connection.removeAllListeners('close');
	// if the underlying connection was closed we emit a 'close' event
	that.connection.once('close', function () {
		console.log('connection closed');
		that.emit('close');
	});

}

IncomingMessage.prototype._read = function () {
	// we never really read from the underlying source in here, so this should be left empty
};

IncomingMessage.prototype.setTimeout = function (msecs, callback) {
	// timeout on the socket
	this.socket.setTimeout(msecs);
	if (callback) {
		this.socket.on('timeout', callback);
	}
};

IncomingMessage.prototype.parseInitialRequestLine = function (initialLine) {
	//parse for request ("method url httpversion")
	var that = this;
//	console.log(initialLine);
	initialLine = initialLine.trim().split(/[ \t]+/);
//	console.log(initialLine);
	if (initialLine.length !== 3) {
		that.error = {code: 500, message: "illegal initial line"};
		return false;
	}
	// extract method, url and http version
	if (!that._addMethod(initialLine[0]) || !that._addUrl(initialLine[1]) || !that._addVersion(initialLine[2])) {
		return false;
	}
	return true;
};

IncomingMessage.prototype._addMethod = function (methodStr) {
	var supportedMethods = ["GET", "POST", "DELETE", "PUT"];
	var methods = supportedMethods.concat(["HEAD", "CONNECT", "UPGRADE"]);
	var that = this;
	var methodIndex = methods.indexOf(methodStr.toUpperCase());
	
	if (methodIndex === -1) {
		that.error = {code: 500, message: "A method could not be extracted from request"};
		return false;
	}
	
	that.method = methods[methodIndex];
	
	if(methodIndex >= supportedMethods.length) {
		that.error = {code: 405, message: that.method + " method currently unsupporded"};
		return false;
	}
	
	return true;
};

IncomingMessage.prototype._addVersion = function (versionStr) {
	var versions = ["HTTP/1.0", "HTTP/1.1", "HTTP/1.2"];
	var that = this;
	if ( versions.indexOf(versionStr.toUpperCase()) === -1) {
		that.error = {code: 500, message: "Illegal HTTP version"}; // TODO: this should be code 505 by the STATUS_CODES of miniHttp. so what should we do?
		return false;
	}
	that.httpVersion = versionStr.substring("HTTP/".length);
	return true;
};

IncomingMessage.prototype._addUrl = function (URLStr) {
	var that = this;
	if (URLStr[0] !== '/') {
		that.error = {code: 500, message: "URL must start with '/'. You used " + URLStr};
		return false;
	}
	that.url = URLStr.trim();
	//TODO : remove comments
	//urlsplit = URLStr.split('?');
	//that.url = urlsplit[0];
	//that.query = urlsplit[1];
	return true;
};


IncomingMessage.prototype.parseHeaders = function (headers) {
	// extract headers
	var that = this;
	var i;
	var colonIndex;
	var headerName;
	var headerValue;
	for (i = 0; i < headers.length; i++) {
		colonIndex = headers[i].indexOf(':');
		if (colonIndex === -1) {
			that.error = {code: 500, message: "Illegal Header: " + headers[i]};
			return false;
		}

		headerName = headers[i].substring(0, colonIndex).trim();
		headerValue = headers[i].substring(colonIndex+1).trim();

		if (headerName === "" || headerValue === "") {
			that.error = {code: 500, message: "Illegal Header: " + headers[i]};
			return false;
		}

		if (!that._addHeader(headerName, headerValue)) {
			return false;
		}
	}
	return true;
};

IncomingMessage.prototype._addHeader = function (name, value) {
	var knownValues;
	var that = this;
	name = name.toLowerCase();
	value = value.toLowerCase();
	switch(name) {
		case "connection":
			knownValues = ["keep-alive", "close"];
			if (knownValues.indexOf(value) === -1) {
				that.error = {code: 500, message: name + " can't have value " + value};
				return false;
			}
			that.headers["connection"] = value;
			break;
		case "content-length":
			if (null !== value.match(/[^1234567890]/)) { //value is non number
				that.error = {code: 500, message: name + " can't have value " + value};
				return false;
			}
			that.remaining = parseInt(value,10); // how many bytes we'll need to read from body
			that.headers["content-length"] = parseInt(value, 10);
			break;
		//case "content-type":
		//	knownValues = ["application/javascript", "text/plain", "text/html", "text/css", "image/jpeg", "image/gif", "image/png"];
		//	if (knownValues.indexOf(value) === -1) {
		//		that.error = {code: 500, message: name + " can't have value " + value};
		//		return false;
		//	}
		//	that.headers["content-type"] = value;
		//	break;
		default: // currently unsupported header, added but ignored
			that.headers[name] = value;
	}
	return true;
};

IncomingMessage.prototype.readBody = function (buff) {
	// will read body and return remaining buffer. also update this.remaining
	var that = this;
	buff = buff.toString();
	if (that.remaining < buff.length) {
		that.push(buff.substring(0, that.remaining));
		buff = buff.substring(that.remaining);
		that.remaining = 0;
	}
	else {
		that.push(buff);
		that.remaining -= buff.length;
		buff = "";
	}
	if (that.remaining === 0) {
		that.push(null);
	}
	return new Buffer(buff, 'utf8');
};

IncomingMessage.prototype.splitHeadersIntoLines = function (headers) {
	return headers.match(/[^\r\n]+/g);
};

module.exports = IncomingMessage;