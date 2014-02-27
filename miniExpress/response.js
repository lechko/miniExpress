//var http = require('../miniHttp');

module.exports = function (res) {
	res.set = function (name, value) {
		if (Array.isArray(value))
			res.setHeader(name, value.map(String));
		else
			res.setHeader(name, String(value));
		return this;
	};

	res.get = res.getHeader;

	res.status = function (code) {
		res.statusCode = code;
		return this;
	};

	res.cookie = function (name, value, options) {
		var cookie = [];
		if (typeof value === 'string') {
			cookie.push(name + "=" + value);
		}
		else {
			try {
				cookie.push(name + "=" + JSON.stringify(value));
			}
			catch (e) {
				console.log("cookie value not string nor JSON");
				return;
			}
		}
		
		if(options) {
			if (options['max-age'])
				cookie.push('Max-Age=' + options['max-age']);
			if (options['domain'])
				cookie.push('Domain=' + options['domain']);
			if (options['path'])
				cookie.push('Path=' + options['path']);
			if (options['expires'])
				cookie.push('Expires=' + options['expires'].toUTCString());
			if (options['http-only'])
				cookie.push('HttpOnly');
			if (options['secure'])
				cookie.push('Secure');
		}

		res.set("Set-Cookie", cookie.join(';'));
	};

	res.send = function (data, opt) {
		var body = data;

		if (opt && (typeof data === "number")) {
			this.status(data);
			body = opt;
		}

		switch (typeof body) {
			case "string":
				if (!this.get('Content-Type'))
					res.set('Content-Type', 'text/html');
				break;
			case "number":
				this.status(body);
				//body = http.STATUS_CODES[body];
				body = res.STATUS_CODES[body];
				break;
			case "object":
				if (Buffer.isBuffer(body) && !res.get('Content-Type')) {
					res.set('Content-Type', 'application/octet-stream');
				}
				else {
					this.json(body);
					return this;
				}
				break;
		}
		res.set('content-length', body.length);
		res.end(body);
	};

	res.json = function(data, opt) {
		if (opt && (typeof data === "number")) {
			this.status(data);
			this.json(opt);
		}

		res.set('Content-Type', 'application/json');
		this.send(JSON.stringify(data));
	};

	return res;
};