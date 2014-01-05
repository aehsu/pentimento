pentimento.lecture_controller = new function() {
    var lecture;
    var slide_control;

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
        this.begin_time = null; //unnecessary??
        this.end_time = null;
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
    };

    this.insert_slide = function() {
        var new_slide = new slide();
        var before_index = this.slides.indexOf(pentimento.state.current_slide);
        slides.insert(before_index+1, new_slide);
        //pentimento.state.change_state('current_slide', new_slide);
        return new_slide;
    };

    this.change_slide = function() {

    };

    this.stop_recording = function() {
        var diff = global_time() - pentimento.state.last_start;
        lecture.duration = lecture.duration + diff;
        pentimento.state.current_slide.duration = pentimento.state.current_slide.duration + diff;
    }

    this.add_visual = function(visual) {
        //slide_control.add_visual(visual);
        pentimento.state.current_slide.visuals.push(visual);
        //console.log(visual);
        //console.log(lecture);
        //console.log(slide_control);
    };

    //DEBUGGING PURPOSES ONLY
    function log_lecture() {
        console.log(lecture);
    }

    $(document).ready(function() {
        var logger = $('<button>LOG-LECTURE</button>');
        $(logger).click(log_lecture);
        $('body div:first').append(logger);
    });

    lecture = new pentimento.lecture();
    pentimento.state.last_start = global_time();
    console.log('lecture created');
    //slide_control = new slide_controller(this.add_slide());
};
