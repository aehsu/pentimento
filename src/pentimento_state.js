/*************************************************
					MODEL
*************************************************/

pentimento.state = new function() {
	this.audio_cursor = null;
	this.video_cursor = null;
	this.lecture_begin_time = null;
	this.is_recording = false;
	this.current_slide = null;
	this.color = null;
	this.current_tool = null;

	this.change_state = function(attr, val) {
		this[attr] = val;
	};
};

