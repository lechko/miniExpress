var request = require("./request");
var response = require("./response");

module.exports = function () {
	var that = this;
	that.middlewares = [];

	that.route = {
		get: [],
		post: [],
		delete: [],
		put: []
	};

	function nextHandler(req, res) {
		var mwIndex = 0;
		var expressRequest = request(req);
		var expressResponse = response(res);

		function matchRequest(req, mw) {

			if(mw.method && mw.method !== req.method.toLowerCase()) {
				return false;
			}


			var match = mw.regexp.exec(req.path);			
			if (match === null)
				return false;
			// found match. set params and such
			req.params = {};
			for (var i = 0; i < mw.keys.length; i++) {
				req.params[mw.keys[i]] = match[i+1];
			}

			req.resource = req.path.match(mw.regexp)[0];
			// console.log("resource= " + req.resource);
			return true; 
		}
//		console.dir(that.middlewares);
		function handler(req, res) {
			
//			console.log("************ mwIndex = " + mwIndex);
			try {
				req.params = {};
				if (req.url.indexOf("..\\") !== -1 || req.url.indexOf("../") !== -1) {
					//that.pageNotFoundHandler(req, res, "", null); //TODO : this is not implemented. prbably best to next until PageNotFound or error response
					throw {code: 500, message: "'..' in url is illegal in our implementation"}; // so it will be caught and 500 static page would be returned
					return;
				}

				//if (req.url.indexOf(that.middlewares[mwIndex].resource) !== 0) {
				if (!matchRequest(req, that.middlewares[mwIndex])) {
					mwIndex++;
					process.nextTick(function () {
						handler(req, res);
					});
					
					return;
				}

				process.nextTick(function () {
					try {//TODO : in this implementation if MW has a catchable exception it will next instead of responding with 500. decide if OK
						//req.resource = that.middlewares[mwIndex].resource; //tODO remove once implemented in matchRequest
						mwIndex++;
						that.middlewares[mwIndex-1].func(req, res, handler);
						
					} catch (error) {
						console.log("Exception was raised in middleware:");
						console.dir(that.middlewares[mwIndex]);
						console.dir(error);
						//mwIndex++;
						handler(req, res);
					}
				});
			} catch (ex) {
				var userMessage = "Internal server error";
				console.dir(ex); // so we can know in debug what went wrong
				res.status(500);

				res.set("content-length", userMessage.length);
				res.end(userMessage);
			}
		}
		readRequestBody(req, function () {
			handler(expressRequest, expressResponse); //TODO : what if body wont come? will the connection close work fine?
		});
	}

	

	nextHandler.get = function(resource, handlerCallback) {
		this.use(resource, handlerCallback);
		that.middlewares[that.middlewares.length - 1].method = "get";		
		updateRoute(that.route, "get", resource, handlerCallback);
		return this;
	};

	nextHandler.post = function(resource, handlerCallback) {
		this.use(resource, handlerCallback);
		that.middlewares[that.middlewares.length - 1].method = "post";
		updateRoute(that.route, "post", resource, handlerCallback);
		return this;
	};

	nextHandler.delete = function(resource, handlerCallback) {
		this.use(resource, handlerCallback);
		that.middlewares[that.middlewares.length - 1].method = "delete";
		updateRoute(that.route, "delete", resource, handlerCallback);
		return this;
	};

	nextHandler.put = function(resource, handlerCallback) {
		this.use(resource, handlerCallback);
		that.middlewares[that.middlewares.length - 1].method = "put";
		updateRoute(that.route, "put", resource, handlerCallback);
		return this;
	};
	
	var updateRoute = function (route, method, resource, handlerCallback) {
		var routingRecord = null;
		var param, paramRegexp = /\:([a-z|0-9]+)/gi;
		var i = 0;

		if(!handlerCallback) {
			handlerCallback = resource;
			resource = "/";
		}

		if (!(method in route)) {
			throw "router update error: unknown method";
		}

		for (i = 0 ; i < route[method].length; i++) {
			if (route[method][i].path === resource) {
				routingRecord = route[method][i];
				break;
			}
		}
		

		if (!routingRecord) {
			regexStr = "^" + resource;
			regexStr = regexStr.replace(paramRegexp, "([a-z|0-9]+)");
			
			routingRecord = {
				'path' : resource,
				'method' : method,
				'callbacks': [],
				'keys' : [],
				'regexp' : new RegExp(regexStr, 'i')
			};

			while ((param = paramRegexp.exec(resource)) !== null) {
				routingRecord.keys.push(param[1]);
			}

			route[method].push(routingRecord);
		}

		routingRecord.callbacks.push(handlerCallback);
	};
	

	nextHandler.use = function (param1, param2) {
		var resource = '/';
		var param, paramRegexp = /\:([a-z|0-9]+)/gi;
		var handler = param1;

		if (param2) {
			resource = param1;
			handler = param2;
		}

		var regexStr = "^" + resource;
		regexStr = regexStr.replace(paramRegexp, "([a-z|0-9]+)");
		
		var mwObj = {
			resource: resource,
			func: handler,
			regexp: new RegExp(regexStr, 'i'),
			keys: []
		};

		while ((param = paramRegexp.exec(resource)) !== null) {
			mwObj.keys.push(param[1]);
		}

		that.middlewares.push(mwObj);

		return this; // for chain support. should be 'this' and not 'that'!
	};

	nextHandler.listen = function (port, callback) {
		if (!this.http)
			throw 'this application instance has no http module';

		that.server = this.http.createServer(this);
		that.server.setTimeout(2000); // 2 seconds timeout
		that.server.listen(port, callback);
		that.server.once('close', function () {
//			console.log("server was closed and we've emitted it");
		});
		
	};

	nextHandler.close = function () {
		that.server.close();
	};
	
	nextHandler.route = that.route;

	return nextHandler;
};

function readRequestBody(req, callback) {
	req.body = '';
	
	if (!req.headers["content-length"] || req.headers["content-length"] == 0) {
		callback();
		return;
	}
	req.on('data', function (data) {
		req.body += data;

		if (req.body.length < req.headers["content-length"])
			return;

		callback();
	});
}