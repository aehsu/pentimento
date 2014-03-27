/*************************************************
					MODEL
*************************************************/

pentimento.state = new function() {
	this.audio_cursor; //why?
	this.video_cursor; //why?
	this.lecture_start_time; //why? all lectures should start at time 0...
	this.is_recording;
	this.current_slide = null;
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
    this.selection = [];
};