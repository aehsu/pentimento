pentimento.lecture_controller = new function() {
    var lecture;
    var state = pentimento.state;
    var interval;
    //var slide_control;
    //var slide; ########???????

    // function slide_controller(live_slide) {
    //     var slide = live_slide;
    //     pentimento.state.current_slide = live_slide;

    //     this.add_visual = function(visual) {
    //         slide.visuals.push(visual);
    //     }

    //     this.stop_recording = function() {
    //         slide
    //     }
    // };

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

    this.add_slide = function() {
        var new_slide = new slide();
        lecture.slides.push(new_slide);
        pentimento.state.current_slide = new_slide;
        new_slide.last_start = global_time();//necessary? YES???
        console.log(new_slide.last_start);
    };

    this.insert_slide = function() { //TODO FIX.
        var new_slide = new slide();
        var before_index = this.slides.indexOf(pentimento.state.current_slide);
        slides.insert(before_index+1, new_slide);
        //pentimento.state.change_state('current_slide', new_slide);
        return new_slide;
    };

    this.change_slide = function() {

    };

    function do_timing() {
        state.current_time += state.interval_timing;
        state.current_slide.duration += state.interval_timing;
    }

    this.begin_recording = function() {
        if(!state.current_slide) {
            this.add_slide();
        } else {
            state.current_slide.last_start = global_time(); //not used.
        }
        interval = setInterval(do_timing, state.interval_timing);
    }

    this.stop_recording = function() {
        clearInterval(interval);//NEED TO REDO SOME LOGIC FOR TIMING OF SLIDES
        //lecture.duration += diff;
    }

    this.add_visual = function(visual) {
        pentimento.state.current_slide.visuals.push(visual);
    };

    this.get_slides_length = function() {
        return lecture.slides.length;
    }

    this.get_slide = function(index) {
        return lecture.slides[index];
    }

    this.get_lecture_duration = function() {
        var time = 0;
        for(slide in lecture.slides) {
            time += lecture.slides[slide].duration;
        }
        return time;
    }

    this.get_slide_from_time = function(time) {
        var total_duration=0;
        for(slide in lecture.slides) {
            if(time > total_duration && time < total_duration+lecture[slide].duration) {
                return lecture[slide];
            } else {
                total_duration += lecture.slides[slide].duration;
            }
        }
    }

    //DEBUGGING PURPOSES ONLY
    function log_lecture() {
        console.log(lecture);
    }
    $(document).ready(function() {
        var logger = $('<button>LOG-LECTURE</button>');
        $(logger).click(log_lecture);
        $('body div:first').append(logger);
    });
    //DEBUGGING PURPOSES ONLY

    lecture = new pentimento.lecture();
    console.log('lecture created');
};
