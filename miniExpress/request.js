module.exports = function(req) {
	this.protocol = "http";

	if (req.headers.host)
		req.host = req.headers.host;

	URLToPathQuery(req);

	req.get = function (headerName) {
		var lcase = headerName.toLowerCase().trim();
		if (lcase === "referer" || lcase === "referrer")
			return req.headers.referer || req.headers.referrer;

		return req.headers[lcase];
	};

	req.param = function (param) {
		if (this.params && (param in this.params))
			return this.params.param;

		if (this.body && (param in this.body))
			return this.body.param;

		if (this.query && (param in this.query))
			return this.query;

		return undefined;
	};

	req.is = function (type) {
		var contentType = req.headers['content-type'];
		if (!contentType || contentType !== type)
			return false;

		return true;
	};

	return req;
};

module.exports.parseUrlEncoded = parseUrlEncoded;

function parseUrlEncoded(query) {
	var params = {};
	query.split('&').forEach(function (paramPair) {
		var paramSplited = paramPair.split('=');
		if (paramSplited.length != 2)
			return;

		params[paramSplited[0]] = paramSplited[1];
	});
	return params;
}

function URLToPathQuery(req) {
	var url = req.url.split('?');
	req.path = url[0];
	if (url[1]) { //there is a query
		req.query = parseUrlEncoded(req.url.substring(req.url.indexOf('?') + 1));
	}
}