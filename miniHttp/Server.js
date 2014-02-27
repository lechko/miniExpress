var eventEmitter = require('events').EventEmitter,
	util = require('util'),
	net = require('net'),
	IncomingMessage = require("./IncomingMessage"),
	ServerResponse = require("./ServerResponse");


// notTODO : 'checkcontinue' event - currently unsupported. this also includes response.writeContinue()
// notTODO : event 'connect' - CONNECT method is unsupported (proxies and stuff) so dont support thios!
// notTODO : event 'upgrade' - we dont really need to support this, but we can.. (we dont support header: upgrade)

util.inherits(Server, eventEmitter);

function Server() { // constructor for sever	
	var that = this;
	eventEmitter.call(that); // calling ctor of eventEmitter
	
	that.maxHeaderscount = 1000;
	that.timeout = 120000;

	that.server = net.createServer(function (socket) {
		var buf = new Buffer(0);
		var request;
		var response;

		that.emit('connection', socket);

		socket.on('data', function (data) {
			buf += data;
			if (!request)
				readNextRequest();
			else {
				buf = request.readBody(buf);
			}
		});

		var readNextRequest = function () {
			//reads requests from inner buffer by order on which they have arrived and pass them for handling
			if (request || response) {
				// do nothing, we are in the middle of handling  a request.
				return;
			}
			var dataString = buf.toString().trimLeft();
			//console.log(dataString);
			var firstBlankLine = dataString.match(/\r\n\r\n|\n\n|\r\n\n|\n\r\n/);
			if (firstBlankLine === null) { // headers of request have not yet arrived				
				return;
			}
			
			request = new IncomingMessage(socket);
			var headers = dataString.substring(0, firstBlankLine.index);
			var remaining = dataString.substring(firstBlankLine.index + firstBlankLine[0].length);
			var remainingBuf = new Buffer(remaining, 'utf8');
			var headerLines = request.splitHeadersIntoLines(headers);
			if (request.parseInitialRequestLine(headerLines.shift()) && request.parseHeaders(headerLines)) {
				// we have a request. We can now create Response and emit a 'request' event
				response = new ServerResponse(request);
				response.once('finish', function () {
					// finish with request and response, we can start over
					request = undefined;
					response = undefined;
					readNextRequest();
				});
				response.once('close', function () {
					that.emit('clientError', {message: "Socket closed before response was sent"}, socket);
				});
				that.emit('request', request, response);
				// update buffer
				buf = request.readBody(remainingBuf);
			}
			else {
				// handle error, close socket (stop listening to requests on this socket)
				handleParseError(request);
				return;
			}
		};
		
		socket.on('error', function (err) {
			that.emit('clientError', err, socket);
			socket.destroy(); //close socket
		});


		socket.setTimeout(that.timeout, function () {
			// emit timeout on request, response and server and see if there are any listeners
			// otherwise, end socket by default.			
			var serverTimeout = that.emit('timeout', socket);
			var requestTimeout = request && request.emit('timeout', socket);
			var responseTimeout = response && response.emit('timeout', socket);
			if (!(serverTimeout || requestTimeout || responseTimeout)) {
				socket.destroy();
			}
		});
	});

	that.server.on('error', function (err) {
		if (err.code === 'EADDRINUSE') {
			console.log("Error: Port already in use.");
		}
		that.emit('error', err);
	});
	
	that.server.on('close', function () {
		that.emit('close'); // pass it on to user
	});
}

var handleParseError = function (request) {
	if (!(request && request.error && request.error.code)) {
		// havent gotten enough information for responding to error
		request.connection.destroy(); //close socket without		
		return;
	}
	var response = new ServerResponse(request);
	response.once('finish', function () {
	//	console.log("socket closed due to error in client's request");
	});
	response.statusCode = request.error.code;
	response.closeConnection = true;
	response.setHeader("content-length", request.error.message.length);
	response.write(request.error.message);
	response.end();
}

Server.prototype.listen = function (port, callback) {
	var that = this;
	that.server.listen(port, callback);
	return that;
};


Server.prototype.close = function (callback) {
	var that = this;
	that.server.close(callback);
};



Server.prototype.setTimeout = function (msecs, callback) {
	// only valid for future connections!
	// using the callback disables the default auto-termination of socket
	var that = this;
	that.timeout = msecs;
	if (callback) {
		that.on('timeout', callback);
	}
};


module.exports = Server;