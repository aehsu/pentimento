/*************************************************
					MODEL
*************************************************/

pentimento.state = new function() {
	this.audio_cursor;
	this.video_cursor;
	this.lecture_start_time;
	this.is_recording;
	this.current_slide; //necessary?
	this.color;
	this.width;
	this.current_tool;
	this.lmb_down; //move this to controller? very local.
	this.last_point; //move this to controller? very local.
	this.context; //move this to controller? very local.
	this.canvas;
	this.current_visual;
	this.pressure;
	this.pressure_color; //false
	this.pressure_width; //false
    this.tool;
    this.current_time = 0;
    this.last_time_update = null;
    this.interval_timing = 50;//ms hmmmmm sure?
};

