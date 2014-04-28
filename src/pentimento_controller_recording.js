pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
    var interval = null;
    var slide_begin = NaN;
    var state = pentimento.state;
    var dirty_visuals;
    
    function end_slide(time) {
        state.current_slide.duration += time - slide_begin;
        slide_begin = NaN;
    }

    this.add_slide = function() {
        slide_begin = global_time();
        if(state.current_slide) { end_slide(slide_begin); } //only end the current_slide if not undefined and not null
        state.current_slide = new Slide();
        pentimento.lecture_controller.add_slide(state.current_slide);
        //call for the lecture_controller
    }

    this.add_visual = function(visual) {
        pentimento.lecture_controller.visuals_controller.add_visual(state.current_slide, visual);
    }
    
	this.begin_recording = function() {
//        pentimento.state.selection=[]; //selection??? what to do with it?
//        pentimento.visuals_controller.update_visuals(true);
//        pentimento.time_controller.update_time(pentimento.state.current_time);//why is this here??
        
        //start some um hierarchy
        slide_begin = global_time();
        pentimento.time_controller.begin_recording(slide_begin);
        pentimento.state.is_recording = true;
        
        if(!state.current_slide) {
            this.add_slide();
        } else {
            //shift as you go!
        }
        // Start the audio recording
        // recordRTC.startRecording();
	}

	this.stop_recording = function() {
        var gt = global_time();
        end_slide(gt);
        pentimento.state.is_recording = false;
        pentimento.time_controller.stop_recording(gt);
        //end the um hierarchy
        
        slide_begin = NaN;
	}
};