var express = require("./miniExpress"),
	http = require('./miniHttp'),
	path = require("path"),
	app = express();

var rootFolder = path.normalize(__dirname + "/www/");

app.get('/', function (req, res, next) {
		console.log("in first get");
		next(req, res);
	})
	.get('/:a/:b/aaa/:c', function (req, res, next) {
		console.log("inside GET handler :) !!!");
		console.log(req.params);

		next(req, res);
	})
	.use(express.static(rootFolder))
	.use(express.pageNotFound());

console.log(app.route);



app.listen(1234);
