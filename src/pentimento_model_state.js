/*************************************************
					MODEL
*************************************************/

pentimento.state = new function() {
	this.audio_cursor;
	this.video_cursor ;
	this.lecture_begin_time;
	this.is_recording;
	this.current_slide;
	this.color;
	this.width;
	this.current_tool;
	this.lmb_down;
	this.last_point;
	this.context;
	this.pressure;
	this.pressure_color;
	this.pressure_width;

	this.change_state = function(attr, val) {
		this[attr] = val;
	};
};

