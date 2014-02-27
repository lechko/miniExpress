function calcController(calc) {
	console.log("creating calcCtrl");

	$("#add").click(function () {
		calc.add(getNumber($("#input").val()), updateScreen);
	});

	$("#mul").click(function () {
		calc.mul(getNumber($("#input").val()), updateScreen);
	});

	$("#clear").click(function () {
		calc.clear(updateScreen);
	});

	$("#settings").click(function () {
		$("#dialog-form").dialog("open");
	});

	$("#input").keypress(numbersonly);
	
	function updateScreen (value) {
		$("#result").text(value);
	}

	$("#dialog-form").dialog({
		autoOpen: false,
		height: 300,
		width: 350,
		modal: true,
		buttons: {
			"Save": function () {
				
				var intRegex = /^\s*(\+|-)?\d+\s*$/;
				var value = $("#new-default").val();
				if(!intRegex.test(value)) {
					alert("please insert an integer...");
					return;
				}

				calc.setDefault(getNumber(value));
				$(this).dialog("close");
			}
		},
		close: function () {
			$("#new-default").val( "" ).removeClass( "ui-state-error" );
		}
	});

	function getNumber(value) {
		if (value === '')
			return 0;
		return parseInt(value, 10);
	}
}

function numbersonly(e){
	var unicode = e.charCode? e.charCode : e.keyCode;
	if (unicode!=8){
		if (unicode<48||unicode>57)
			return false;
	}
}

