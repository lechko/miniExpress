var net = require("net");

var connectionsCount = 300000;
var requestsPerConnection = 1;
var responses = 0;

var current = 0;
setTimeout(function makeConnections() {
	for(var i = current; i < current + 400 && i < connectionsCount; i++){
		makeRequest();
	}
	current += 400;
	if (current >= connectionsCount) {
		return;
	}
	setTimeout (makeConnections, 1500);

}, 1500);


function makeRequest() {
	var req = "GET /test3.css HTTP/1.0\r\n\r\n";
	try {
		var client = net.connect({port: 1234}, function () {
			for (var i = 0; i < requestsPerConnection; i++) {
				client.write(req);
			}
		});
		client.on('data', function (data) {
			console.log("recieved data, size: " + data.length);
		});
		client.on('end', function () {

		});
	}
	catch ( err ) {
		console.log("*** ERR ***");
	}

	
}