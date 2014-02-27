var express = require("./miniExpress");
var http = require("http");
var fs = require("fs");
var testIndex = 0;
var app = express();

function runTest(test, next) {
	test.serverSide(app, next);
	app.listen(3000);
	test.clientSide(next);
}

function nextTest(result) {
	app.close();
	app = express();

	testIndex++;
	if (testIndex >= tests.length) {
		printResults();
		createHtmlDocument();
		return;
	}

	process.nextTick(function () {
		runTest(tests[testIndex], nextTest);
	});
}

function printResults() {
	console.log('Printing test results:\n');
	tests.forEach(function (test) {
		console.log(" - " + test.description);
		test.result.split(';').forEach(function (res) {
			console.log("\t" + res);
		});
	});
}

function createHtmlDocument() {
	var htmlStr = '';
	tests.forEach(function (test) {
		htmlStr += "<h4>" + test.description + "</h4>";
		test.result.split(';').forEach(function (res) {
			htmlStr += "<p>" + res + "</p>";
		});
	});

	htmlStr = "<html><head><title>Tests</title><head><body>" + htmlStr + "</body></html>";
	var file = fs.openSync("tests-doc.html", 'w');
	fs.writeSync(file, new Buffer(htmlStr, 'UTF8'), 0, htmlStr.length);
}

var tests = [
	{
		description: 'simple test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(function (req, res) {
				that.result += 'sending response;';
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
				method: 'GET'
			};
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).end();
		}
	},
	{
		description: '.cookieParser test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.cookieParser());
			app.use(function (req, res) {
				if (req.cookies['1'] == '1' && req.cookies['2'] == '2') {
					that.result += "cookieParser PASS;";
				}
				else {
					that.result += "cookieParser: FAIL;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{'cookie':'1=1;2=2'}
			};
			
			http.request(options).on('error', function () {}).end();
		}
	},
	{
		description: '.json() MW test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.json());
			app.use(function (req, res) {
				if (req.body['a'] == 'a' && req.body['b'] == 'b') {
					that.result += "json PASS;";
				}
				else {
					that.result += "json FAIL;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var json = JSON.stringify({'a':'a', 'b':'b'});
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{
					'content-type':'application/json',
					'content-length': json.length
				}
			};
			
			var client = http.request(options).on('error', function () {});
			client.write(json);
			client.end();
		}
	},
	{
		description: '.json() MW test where content-length isnt application/json',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.json());
			app.use(function (req, res) {
				if (req.body['a'] == 'a' && req.body['b'] == 'b') {
					that.result += "json FAIL;";
				}
				else {
					that.result += "json PASS;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var json = JSON.stringify({'a':'a', 'b':'b'});
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{
					'content-length': json.length
				}
			};
			
			var client = http.request(options).on('error', function () {});
			client.write(json);
			client.end();
		}
	},
	{
		description: '.urlEncoded() MW test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.urlencoded());
			app.use(function (req, res) {
				if (req.body['a'] == 'a' && req.body['b'] == 'b') {
					that.result += "urlEncoded PASS;";
				}
				else {
					that.result += "urlEncoded FAIL;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var body = "a=a&b=b";
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{
					'content-type':'application/x-www-form-urlencoded',
					'content-length': body.length
				}
			};
			
			var client = http.request(options).on('error', function () {});
			client.write(body);
			client.end();
		}
	},
	{
		description: '.bodyParser() MW test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.bodyParser());
			app.use(function (req, res) {
				if (req.body['a'] == 'a' && req.body['b'] == 'b') {
					that.result += "bodyParser PASS;";
				}
				else {
					that.result += "bodyParser FAIL;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var json = JSON.stringify({'a':'a', 'b':'b'});
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{
					'content-type':'application/json',
					'content-length': json.length
				}
			};
			
			var client = http.request(options).on('error', function () {});
			client.write(json);
			client.end();
		}
	},
	{
		description: '.bodyParser() MW second test: content-type: json, body received as query string',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.bodyParser());
			app.use(function (req, res) {
				if (req.body['a'] == 'a' && req.body['b'] == 'b') {
					that.result += "bodyParser FAIL;";
				}
				else { // uelEncoded didnt catch and manipulated data
					that.result += "bodyParser PASS;";
				}
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var json = "a=a&b=b";
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{
					'content-type':'application/json',
					'content-length': json.length
				}
			};
			
			var client = http.request(options).on('error', function () {});
			client.write(json);
			client.end();
		}
	},
	{
		description: 'illegal header test (sending illegal connection value)',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.static("./www/"));			
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/',
				headers:{'connection':'1=1;2=2'}
			};
			
			http.request(options, function (res) {
				that.result += "should be 500: " + res.statusCode + ";";
				next();

			}).on('error', function () {}).end();
		}
	},
	{
		description: 'content-type value in request',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.static("./www/"));	
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/profile.html',
				headers:{'content-type':'asd'}
			};
			
			http.request(options, function (res) {
				that.result += "should be 200: " + res.statusCode + ";";
				that.result += "should be asd: " + res.headers["content-type"] + ";";
				next();

			}).on('error', function () {}).end();
		}
	},
	{
		description: "non of the handlers match test\r\n\t(also checks static responds only to get\r\n\tand that MW registered using .get, .put, .delete doesnt respond to post req)",
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(express.static("./www/"))
				.use('/aaa/:y', function (res, req) {
					res.end();
				})
				.put(express.static("./www/"))
				.use('/aaa/:y', function (res, req) {
					res.end();
				})
				.delete(express.static("./www/"))
				.use('/aaa/:y', function (res, req) {
					res.end();
				})
				.get(express.static("./www/"))
				.use('/aaa/:y', function (res, req) {
					res.end();
				})
				.use(express.pageNotFound());
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/profile.html',
				method: 'post'
			};
			
			http.request(options, function (res) {
				that.result += "should be 404: " + res.statusCode + ";";				
				next();


			}).on('error', function () {}).end();
		}
	},
	{
		description: "response set cookie",
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.post('/', function (req, res) {
					res.cookie("cookie1", "value1", {'max-age':10});
					res.cookie("cookie2", "value2");
					res.end("aaa");
				});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port:3000,
				path:'/profile.html',
				method: 'post'
			};
			
			http.request(options, function (res) {
				that.result += "should be 200: " + res.statusCode + ";";
				that.result += "cookies: " + res.headers['set-cookie'] + ";";
				next();

			}).on('error', function () {}).end();
		}
	},
	{
		description: 'GET method test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.get(function (req, res) {
				that.result += 'got GET request;';
				// console.log(that);
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
			};
			options.method = 'GET';
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).end();
		}
	},
	{
		description: 'POST method test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.post(function (req, res) {
				that.result += 'got POST request;';
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
			};
			options.method = 'POST';
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).end();
		}
	},
	{
		description: 'DELETE method test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.delete(function (req, res) {
				that.result += 'got DELETE request;';
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
			};
			options.method = 'DELETE';
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).end();
		}
	},
	{
		description: 'PUT method test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.put(function (req, res) {
				that.result += 'got PUT request;';
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
			};
			options.method = 'PUT';
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).end();
		}
	},
	{
		description: 'HEAD method test, should not be supported',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(function (req, res) {
				that.result += 'got HEAD request;';
				res.send(200);
			});
		},
		clientSide: function (next) {
			var that = this;
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/',
			};
			options.method = 'HEAD';
			http.request(options, function(res) {
				that.result += 'got response;';
				next();
			}).on('error', function (err) {console.log(err);}).end();
		}
	},
	{
		description: '.use() tests, with no resource',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(function (req, res) {
				that.result += 'got request;';
				that.result += 'url: ' + req.url + ';';
				next();
			});
		},
		clientSide: function (next) {
			http.get('http://localhost:3000/').on('error', function () {});
		}
	},
	{
		description: '.use() tests, with simple resource',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use('/aaa/bbb',function (req, res) {
				that.result += 'got request;';
				that.result += 'url: ' + req.url + ';';
				next();
			});
		},
		clientSide: function (next) {
			http.get('http://localhost:3000/aaa/bbb/asd').on('error', function () {});
		}
	},
	{
		description: '.use() tests, resource with params',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use('/aaa/:param1/bbb', function (req, res) {
				that.result += 'got request;';
				that.result += 'params = ' + JSON.stringify(req.params) + ';';
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			http.get('http://localhost:3000/aaa/myparam/bbb/ccc').on('error', function () {});
		}
	},
	{
		description: 'Request functionality tests',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use('/aaa/:param1', function (req, res) {
				that.result += 'got request;';
				that.result += 'path: ' + req.path + ';';
				that.result += 'host: ' + req.host + ';';
				that.result += 'query: ' + JSON.stringify(req.query) + ';';
				that.result += 'params: ' + JSON.stringify(req.params) + ';';
				that.result += 'Content-Type: ' + req.get('content-type') + ';';
				that.result += 'is javascript: ' + req.is('text/javascript') + ';';
				that.result += 'is html: ' + req.is('text/html') + ';';
				that.result += 'request body: ' + req.body + ';';
				next();
			});
		},
		clientSide: function (next) {
			var that = this;
			var body = 'this is my request data';
			var options = {
				hostname: 'localhost',
				port: 3000,
				path: '/aaa/myparam/asdf.html?var=myvar',
				headers: {
					'content-type': 'text/javascript',
					'content-length': body.length
				}
			};
			var req = http.request(options);
			req.write(body);
			req.on('error', function () {}).end();
		}
	},
	{
		description: 'Response functionality tests',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.use(function (req, res) {
				res.set('content-type', 'text/html');
				res.status(200);
				res.cookie('mycookie', 'cookie value', {'expires':new Date(), 'http-only':true});
				res.send({'itemName':'Name', 'itemValue':'Value'});
			});
		},
		clientSide: function (next) {
			var that = this;
			http.get('http://localhost:3000/', function (res) {
				var body = '';

				that.result += 'Status Code: ' + res.statusCode + ';';
				that.result += 'Headers: ' + JSON.stringify(res.headers) + ';';

				res.on('data', function(data) {
					body += data;
					if (body.length < res.headers['content-length'])
						return;

					that.result += 'Body: ' + body + ';';
				});
				next();
			}).on('error', function () {});
		}
	},
	{
		description: 'Route printing test',
		result: '',
		serverSide: function (app, next) {
			var that = this;
			app.get('/route1', function () {});
			app.post('/route1', function () {});
			app.get('/route2', function () {});
			app.delete('/route2/:param', function () {});
			app.put('/route2', function () {});
			app.delete('/route2', function () {});

			that.result += JSON.stringify(app.route) + ';';
		},
		clientSide: function (next) {
			next();
		}
	}

	
];

console.log("=========== starting tests ===========");
runTest(tests[0], nextTest);