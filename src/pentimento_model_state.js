/*************************************************
					MODEL
*************************************************/
pentimento.state = new function() {
	this.audio_cursor; //why?
	this.video_cursor; //why?
	this.lecture_start_time; //why? all lectures should start at time 0...
    
	this.is_recording;
    
	this.color;
	this.width;
    this.pressure;
	this.pressure_color; //false
	this.pressure_width; //false
    
    this.canvas;
    this.context; //move this to controller? very local.

	this.lmb;
    this.mmb;
    this.rmb;
    this.ctrlKey;
    this.shiftKey;
    this.altKey;
    
    this.tool;
	this.last_point;
    this.selection;
    
    this.current_slide;
    this.current_time;
    this.last_time_update;
};

// Returns true if this Internet Explorer 10 or greater, running on a device
// with msPointer events enabled (like the ms surface pro)
function ie10_tablet_pointer() {
    var ie10 = /MSIE (\d+)/.exec(navigator.userAgent);

    if (ie10 != null) {
        var version = parseInt(ie10[1]);
        if (version >= 10) { ie10 = true; }
        else { ie10 = false; }
    } else { ie10 = false; }

    var pointer = navigator.msPointerEnabled ? true : false;
    if (ie10 && pointer) { return true; }
    else { return false; }
}

$(document).ready(function() {
    pentimento.state.canvas = $('#sketchpad');
    pentimento.state.is_recording = false;
    pentimento.state.lmb = false;
    pentimento.state.last_point = null;
    pentimento.state.color = '#777';
    pentimento.state.width = 2;
    pentimento.state.context = pentimento.state.canvas[0].getContext('2d');
    pentimento.state.current_time = 0;
    pentimento.state.selection = [];

    if (ie10_tablet_pointer()) {
        console.log('Pointer Enabled Device');
        pentimento.state.pressure = true;
        pentimento.state.pressure_color = true;
        pentimento.state.pressure_width = true;
    } else {
        console.log('Pointer Disabled Device');
        pentimento.state.pressure = false;
        pentimento.state.pressure_color = false;
        pentimento.state.pressure_width = false;
    }
})