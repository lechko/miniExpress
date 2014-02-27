// both ClientRequest and ServerResponse share similar functionality
// in terms of headers API and transmiting outgoing messages.
// OutgoingMessage has the similar methods, and both can inherit from
// it.


var Writable = require('stream').Writable;
var util = require('util');

util.inherits(OutgoingMessage, Writable);

function OutgoingMessage(socket, opt) {
	var that = this;
	Writable.call(this, opt);
}

OutgoingMessage.prototype._write = function (chunk, encoding, callback) {
	var that = this;

	if (encoding && typeof encoding !== 'string') {
		callback = encoding;
		encoding = null;
	}

	that.socket.write(chunk, encoding, function (err) {
		if (err) {
			that.socket.destroy();
			that.emit("close", err);
			return;
		}
		if (callback) {
			callback(err);
		}
	});

	return true;
};


OutgoingMessage.prototype.setTimeout = function (msecs, callback) {
	this.socket.setTimeout(msecs);
	if (callback) {
		this.socket.on('timeout', callback);
	}
};


OutgoingMessage.prototype.setHeader = function (name, value) {
	var that = this;
	name = name.toString().trim().toLowerCase();
	if (value instanceof Array) {
		value = value.map(String);
	}
	else {
		value = value.toString().trim().toLowerCase();
	}
	if (that.headers[name]) {
		// header exists, need to chain
		that.headers[name] = [].concat(that.headers[name]).concat(value);
	}
	else {
		that.headers[name] = value;
	}
	return that;
};


OutgoingMessage.prototype.getHeader = function (name) {
	var that = this;
	name = name.toString().trim().toLowerCase();
	return that.headers[name];
};

OutgoingMessage.prototype.removeHeader = function (name) {
	var that = this;
	name = name.toString().trim().toLowerCase();
	delete that.headers[name];
};


OutgoingMessage.prototype.write = function (chunk, encoding) {
	var that = this;

	if (!that.headersSent) {
		// send headers implicitely
		that.writeHead(that.statusCode, that.headers);
	}
	//write body	
	that._write(chunk, encoding);
};


OutgoingMessage.prototype.end = function (data, encoding) {
	var that = this;
	if (data) {
		that.write(data, encoding);
		that.end();
		return;
	}
	if(!that.headersSent) {
		that.writeHead(that.statusCode, that.headers);
		that.end();
		return;
	}
	
	that._write("", function () {
		if (that.closeConnection) {
			that.socket.destroy();
		}
		that.emit("finish");
	});

};

 module.exports = OutgoingMessage;