pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
    var tmp_lecture = null;
	var tmp_lecture_controller = null;
    var recording_params = null;
    var slide_begin = NaN;
    var working_slide = null;
    var state = pentimento.state;
    
    function end_slide(end_time) {
    	working_slide.duration += end_time-slide_begin;
        slide_begin = NaN;
        working_slide = null;
    }

    this.add_slide = function() {
        slide_begin = global_time();
        if(working_slide!=null) { end_slide(slide_begin); }
        working_slide = new Slide();
        tmp_lecture_controller.add_slide(working_slide);
    };

    this.add_visual = function(visual) {
        visual.tMin -= slide_begin;
        for(var vert in visual.vertices) {
            visual.vertices[vert].t -= slide_begin;
        }
        tmp_lecture_controller.visuals_controller.add_visual(working_slide, visual);
    };
    
	this.begin_recording = function() {
//        pentimento.state.selection=[]; //selection??? what to do with it?
//        pentimento.visuals_controller.update_visuals(true);
//        pentimento.time_controller.update_time(pentimento.state.current_time);//why is this here??
        
        //start some um hierarchy
        recording_params = { time: state.current_time, slide: state.current_slide };
        pentimento.time_controller.begin_recording();
        pentimento.state.is_recording = true;
        
        //manually insert first slide to prevent having to "undo" twice to uninsert the recording
        working_slide = new Slide();
        slide_begin = global_time();
        
        tmp_lecture = new Lecture();
        tmp_lecture.slides.push(working_slide);
        tmp_lecture_controller = new LectureController(tmp_lecture);
        // Start the audio recording
        // recordRTC.startRecording();
	};

	this.stop_recording = function() {
        var gt = global_time();
        end_slide(gt);
        pentimento.state.is_recording = false;
		pentimento.lecture_controller.accept_recording(tmp_lecture, recording_params);
        pentimento.time_controller.stop_recording();
        //end the um hierarchy
        
        tmp_lecture_controller = null;
        recording_params = null;
        slide_begin = NaN;
        working_slide = null;
	}
};