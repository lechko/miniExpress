function Calc() {
	this.defaultValue = 0;
	var result = this.defaultValue;
	var that = this;
	
	this.setDefault = function (value) {
		that.defaultValue = value;
	};

	this.add = function (value, callback) {
		result += value;
		callback(result);
	};

	this.mul = function (value, callback) {
		result *= value;
		callback(result);
	};

	this.clear = function (callback) {
		result = that.defaultValue;
		callback(result);
	};

	console.log("creating calc");
}