/*************************************************
					HELPERS
*************************************************/

function global_time() {
    var d = new Date();
    return d.getTime(); //milliseconds
}

/*************************************************
			PENTIMENTO DECLARATION
 private methods not exposable through namespace
*************************************************/
var pentimento = {};//new function() {};
var ordered_files = ["pentimento_model_lecture.js", "pentimento_model_state.js", "pentimento_controller_lecture.js", "pentimento_controller_uiux.js"]; //order of the loading does matter

(function() {

	function load_script(filename, callback) {
		console.log(filename);
		var head = $('head');
		var script = $('<script></script>', {
			type: 'text/javascript', 
			src: filename
		});

		if (ordered_files.length > 0) {
			var file = ordered_files.shift();
			//script.onreadystatechange = callback(file, load_script);
			script.onload = callback(file, load_script);
		}

		head.append(script);
	}
	load_script(ordered_files.shift(), load_script)
})();