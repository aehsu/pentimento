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

    function slide_change(from_page, to_page) { //should this live with t_audio????
        this.from_page = from_page;
        this.to_page = to_page;
        //this.t_audio = t_audio;
    };

    this.add_slide = function() {
    	//some checking for whether or not to insert a new slide_change??
        //should this strictly be just a thing where you add at the end? that seems wrong.

    	if(lecture.slides.length != 0) { //maybe we need a more robust check mechanism...???
    		var idx = lecture.slides.indexOf(pentimento.state.current_slide);
    		lecture.slide_changes.push(new slide_change(idx, idx+1));
    		end_slide();
    	}
        var new_slide = new slide();
        lecture.slides.push(new_slide);
        pentimento.state.current_slide = new_slide; //local???? probs
        new_slide.last_start = pentimento.state.current_time;//necessary? YES??? NO????
    };

    function end_slide() { //jesus save me.
    	pentimento.state.current_slide.duration += pentimento.state.current_time - pentimento.state.current_slide.last_start;//jesus. save me
    	pentimento.state.current_slide = null;
    }

    // this.insert_slide = function() { //TODO FIX.
    //     var new_slide = new slide();
    //     var before_index = this.slides.indexOf(pentimento.state.current_slide);
    //     slides.insert(before_index+1, new_slide);
    //     //pentimento.state.change_state('current_slide', new_slide);
    //     return new_slide;
    // };

    this.change_slide = function() {

    };

    this.add_visual = function(visual) {
        pentimento.state.current_slide.visuals.push(visual); //change to local????
    };

	this.do_record = function() {
		lecture = new pentimento.lecture();
		recording_params = pentimento.lecture_controller.get_recording_params();
		this.add_slide();
	};

	this.stop_record = function() {
        console.log('stop_record function called');
        console.log('recording params value {"current_slide":'+recording_params['current_slide']+', "time_in_slide":'+recording_params['time_in_slide']);
		end_slide();

        var t = 0;
        for(var i=0; i<lecture.slides.length; i++) {
            var slide = lecture.slides[i];
            console.log('the duration of slide '+i+' is:' +slide.duration);
            for(visual in slide.visuals) {
                slide.visuals[visual].tMin-=t;
            }
            t+=slide.duration;
        }
        console.log('some sanity checking happening');
        if(lecture.slides[0].visuals[0] && lecture.slides[1].visuals[1]) {
            console.log('tMin for first and second visuals:' + lecture.slides[0].visuals[0].tMin + ', ' + lecture.slides[0].visuals[1].tMin);
        }
        var tmp = lecture.slides[lecture.slides.length-1].visuals;
        console.log('tMin for last visual' + tmp[tmp.length-1].tMin);

		pentimento.lecture_controller.insert_recording(lecture, recording_params);
		recording_params = null;
		lecture = null;
	}
};