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
    this.begin_recording = function() {
        if(!state.current_slide) { //jesus save me
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

    this.get_recording_params = function() {
        if(!state.current_slide) { //jesus save me. jesus, save me.
            return {
                'current_slide': null,
                'time_in_slide': null
            };
        } else {
            var total_duration = 0;
            for(slide in lecture.slides) { //something...equals...something...
                if (state.current_time > total_duration && state.current_time < total_duration+lecture[slide].duration) {
                    return {
                        'current_slide': slide,
                        'time_in_slide': state.current_time - total_duration
                    };
                } else {
                    total_duration += lecture.slides[slide].duration;
                }
            }
            //alert('should never get here');
            //return false;
        }
    }

    function insert_visuals_into_slide(to_slide, from_slide, insertion_time) { //should have insert_audio?
        var before = [];
        var after = to_slide.visuals;

        while(after.length!=0 && after[0].tMin < insertion_time) {
            before.push(after.shift());
        }
        $.each(after, function(index, value) {//shift
            value.tMin += from_slide.duration;
        });
        to_slide.visuals = before.concat(from_slide.visuals.concat(after));

        //update duration
    }

    this.insert_recording = function(recording, params) {
        if(params['current_slide']==null) {
            lecture = recording;
        } else { //what if recording has slide_changes? ambiguous.
            var slide = lecture.slides[params['current_slide']];

            insert_visuals_into_slide(slide, recording.slide[0], params['time_in_slide']);
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER
            //TODO INSERT SOME VISUALS FROM DIFFERENT SLIDES RIGHT AFTER


        }
    }



    this.get_slide_from_time = function(time) { //returns a copy; makes original immutable. necessary???
        var total_duration=0;
        for(slide in lecture.slides) {
            if(time > total_duration && time < total_duration+lecture[slide].duration) {
                return $.extend(true, {}, lecture[slide]); //private
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
