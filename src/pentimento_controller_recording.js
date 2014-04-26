pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
	var tmp_lecture_controller = null;
    var recording_params = null;
    var slide_begin = NaN;
    var working_slide = null;
    var state = pentimento.state;
    
    function draw_recording_visuals(slide) {
        for(var vis in slide.visuals) {
            draw_visual(working_slide.visuals[vis].access());
        }
    }
    
    function do_end_slide(end_time) {
    	working_slide.duration += end_time-slide_begin;
        slide_begin = NaN;
        working_slide = null;
    }

    this.add_slide = function() {
        working_slide = new Slide();
        slide_begin = global_time();
        tmp_lecture_controller.add_slide(working_slide);
    };

    this.add_visual = function(visual) {
        //timing of the visual?
        tmp_lecture_controller.visuals_controller.add_visual(working_slide, visual);
    };
    
	this.begin_recording = function() {
//        pentimento.state.selection=[]; //selection??? what to do with it?
//        pentimento.visuals_controller.update_visuals(true);
//        pentimento.time_controller.update_time(pentimento.state.current_time);//why is this here??
        recording_params = { time: state.current_time, slide: state.current_slide };
        pentimento.state.is_recording = true;
        pentimento.time_controller.begin_recording();
        tmp_lecture_controller = new LectureController();
        this.add_slide();
        // Start the audio recording
        // recordRTC.startRecording();
	};

	this.stop_recording = function() {
        var gt = global_time();
        do_end_slide(gt);
        pentimento.time_controller.stop_recording();
        pentimento.state.is_recording = false;
		pentimento.lecture_controller.accept_recording(tmp_lecture_controller.get_lecture_accessor(), recording_params);
        
        tmp_lecture_controller = null;
        recording_params = null;
        slide_begin = NaN;
        working_slide = null;
	}
};