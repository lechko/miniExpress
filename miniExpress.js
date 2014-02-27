var fs = require("fs"),
	app = require("./miniExpress/application"),
	http = require('./miniHttp'),
	request = require("./miniExpress/request"),
	response = require("./miniExpress/response");


// use module.exports so we can use this module as a function
exports = module.exports = function () {
	var a = new app();
	a.http = http;
	return a;
};

var getContentType = function (req) {
	if (req.headers["content-type"]) {
		return req.headers["content-type"];
	}
	else {
		// get content type out of file name
		var fileType = req.url.split('.');
		fileType = fileType[fileType.length - 1];
		switch (fileType.toLowerCase()) {
			case "js":
				return "application/javascript";
			case "htm":
			case "html":
				return "text/html";
			case "css":
				return "text/css";
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "gif":
				return "image/gif";
			case "png":
				return "image/png";
			default:
				return "text/plain";
		}		
	}
};


exports.static = function (rootFolder) {
	return function (req, res, next) {
		var path,
			filestream;

		if(req.method.toLowerCase() != "get") {
			next(req, res);
			return;
		}

		if (req.url.indexOf(req.resource) !== 0) {
			next(req, res);
			return;
		}

		path = rootFolder + req.url.substring(req.resource.length);
		
		fs.open(path, 'r', function (err, fds) {
			if (err) {
				next(req, res);
				return;
			}
			fs.fstat(fds, function (err, stats) {
				if (err) {
					fs.close(fds);
					next(req, res);
					return;
				}
				if (!stats.isFile()) {
					fs.close(fds);
					next(req, res);
					return;
				}
				res.set('content-type', getContentType(req));
				res.set('content-length', stats.size);
				res.set('last-modified', stats.mtime);

				res.writeHead(200, "OK", res.headers);

				filestream = fs.createReadStream(path, {fd: fds, autoClose: true});
				
				filestream.pipe(res, {end: true});

			});
		});
	};
};

exports.cookieParser = function () {
	return function (req, res, next) {
		if (!req.headers["cookie"]) {
			next(req, res);
			return;
		}

		req.cookies = {};
		req.headers["cookie"].split(';').forEach(function (cookie) {
			var cookieParts = cookie.trim().split('=');
			if (cookieParts.length != 2)
				return;

			req.cookies[cookieParts[0]] = cookieParts[1];
		});

		next(req, res);
	};
};

exports.json = function () {
	return function (req, res, next) {
		if (req.headers["content-type"] !== 'application/json') {
			next(req,res);
			return;
		}

		try {
			req.body = JSON.parse(req.body);
		} catch (error) {
			console.log("failed parsing body as json");
		}

		next(req, res);
		
	};
};

exports.urlencoded = function () {
	return function (req, res, next) {
		if (req.headers["content-type"] && req.headers["content-type"].indexOf('application/x-www-form-urlencoded')!==0) {
			next(req,res);
			return;
		}

		req.body = request.parseUrlEncoded(req.body);
		next(req, res);
	};
};

exports.bodyParser = function () {
	var self = this;
	return function (req, res, next) {
		var jsonMW = self.json();
		var urlencodedMW = self.urlencoded();
		jsonMW(req, res, function (req, res) {
			urlencodedMW(req, res, next);
		});
	};
};

exports.pageNotFound = function () {
	return function (req, res, next) {
		var body = "Page Not Found";

		res.setHeader('content-length', body.length);
		res.setHeader('content-type', 'text/html');

//		console.dir(res.headers);
		res.writeHead(404, res.headers);
		res.write(body);
		res.end();
	};
};













