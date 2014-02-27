var calcCtrl;
$("document").ready(function () {
	$("#submit-login").click(function () {
		var username = $("#username").val();
		var password = $("#password").val();
		if (username == "admin" && password == "admin") {
			calcCtrl = new calcController(new Calc());
			showCalc();
		}
	});
});

function showCalc() {
	$("#info").hide();
	$(".calculator").show();
}