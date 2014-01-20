pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
	var lecture = null;
	var recording_params;

	//move to elsewhere? high level function?
    function slide() {
        this.last_start = null;
        this.visuals = [];
        this.duration = 0;

        this.add_visual = function(visual) {
            this.VISUALS.push(visual);
        }
        this.get_visuals = function() {
            return this.VISUALS;
        }
        this.get_visual_by_index = function(index) {
            return this.VISUALS[index];
        }
        this.insert_visual_at_index = function(visual, index) {

        }
        this.insert_visual_at_time = function(visual, t_audio) { //t_audio, t_visual?

        }
    };

    function slide_change(from_page, to_page, t_audio) { //should this live with t_audio????
        this.from_page = from_page;
        this.to_page = to_page;
        this.t_audio = t_audio;
    };

    function add_slide() {
        var new_slide = new slide();
        lecture.slides.push(new_slide);
        pentimento.state.current_slide = new_slide; //local???? probs
        new_slide.last_start = pentimento.state.current_time;//necessary? YES???
    };

    function end_slide() {
    	pentimento.state.current_slide.duration = pentimento.state.current_time - pentimento.state.current_slide.last_start;//so baddd
    }

    this.insert_slide = function() { //TODO FIX.
        var new_slide = new slide();
        var before_index = this.slides.indexOf(pentimento.state.current_slide);
        slides.insert(before_index+1, new_slide);
        //pentimento.state.change_state('current_slide', new_slide);
        return new_slide;
    };

    this.change_slide = function() {

    };

    this.add_visual = function(visual) {
        pentimento.state.current_slide.visuals.push(visual); //change to local????
    };

	this.do_record = function() {
		lecture = new pentimento.lecture();
		recording_params = pentimento.lecture_controller.get_recording_params();
		add_slide();
	};

	this.stop_record = function() {
		end_slide();
		pentimento.lecture_controller.insert_recording(lecture, recording_params);
		recording_params = null;
		lecture = null;
	}
};