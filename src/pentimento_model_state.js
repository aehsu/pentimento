/*************************************************
					MODEL
*************************************************/

pentimento.state = new function() {
	this.audio_cursor;
	this.video_cursor;
	this.lecture_begin_time;
	this.is_recording;
	this.current_slide;
	this.color;
	this.width;
	this.current_tool;
	this.lmb_down; //move this to controller? very local.
	this.last_point; //move this to controller? very local.
	this.context; //move this to controller? very local.
	this.pressure;
	this.pressure_color; //false
	this.pressure_width; //false

	this.change_state = function(attr, val) {
		this[attr] = val;
	};
};

