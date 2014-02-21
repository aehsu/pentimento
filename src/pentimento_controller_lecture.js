pentimento.lecture_controller = new function() {
    var lecture;
    var state = pentimento.state;
    var interval;
    var audio_timeline_scale = 10;
    var wavesurfer = Object.create(WaveSurfer);

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
        if(!state.current_slide) { //maybe fix? maybe change? 
            return {
                'current_slide': null,
                'time_in_slide': null
            };
        } else {
            var total_duration = 0;
            for(slide in lecture.slides) { //something...equals...something...
                if (state.current_time > total_duration && state.current_time <= total_duration+lecture.slides[slide].duration) {
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
        to_slide.duration += from_slide.duration;
    }

    this.insert_recording = function(recording, params) {
        if(params['current_slide']==null) {
            lecture = recording;
        } else {
            var slide = lecture.slides[params['current_slide']];

            insert_visuals_into_slide(slide, recording.slides.shift(), params['time_in_slide']);
            
            var before = [];
            var after = lecture.slides;
            for(var i=0; i<=params['current_slide']; i++) {
                before.push(after.shift());
            }

            lecture.slides = before.concat(recording.slides.concat(after));
            //some logic. the timing is wrong for this
            //if just one slide in recording.slides to begin with, no change.
            //else we gotta shift 
            if(recording.slides.length!=0) {
                //accumulate times up to sum of all in params['current_slide'] and
                //all of recording.slides
                //TODO TODO TODO TODO TODO
            }

            //shift slide_change events as well.
            //shift slide_change events as well.
            //shift slide_change events as well.
            //shift slide_change events as well.
            //shift slide_change events as well.
            //shift slide_change events as well.
            for(var i=params['current_slide']; i<lecture.slide_changes.length; i++) {
                lecture.slide_changes[i].from_slide+=1;
                lecture.slide_changes[i].to_slide+=1;
            }
            //need to shift the current slide change also. more such to fixxxxx
        }

        pentimento.state.current_slide = get_slide_from_time(state.current_time);
    }


    function get_slide_from_time(time) { //returns a copy; makes original immutable. necessary???
        var total_duration=0; //something...something...equals
        for(slide in lecture.slides) {
            if(time >= total_duration && time <= total_duration+lecture.slides[slide].duration) {
                return lecture.slides[slide];
                //return $.extend(true, {}, lecture[slide]); //private
            } else {
                total_duration += lecture.slides[slide].duration;
            }
        }
    }

    //DEBUGGING PURPOSES ONLY
    function log_lecture() {
        console.log(lecture);
        window.lec = lecture;
    }
    $(document).ready(function() {
        var logger = $('<button>LOG-LECTURE</button>');
        $(logger).click(log_lecture);
        $('body div:first').append(logger);


        var create_audio_track = function(audio_track) {
            var new_track_id = "track-" + $("#audio_timeline").children(".audio_track").length;
            var new_track = $('<div></div>').attr({"id": new_track_id , "class": "audio_track"});
            new_track.data(audio_track);
            $("#audio_timeline").append(new_track);
        };

        var create_audio_segment = function(audio_segment) {
            var new_segment_id = "segment-" + $("#track-0").children(".audio_segment").length;
            var clip = $("<div></div>").attr({"id": new_segment_id, "class": "audio_segment"}).data(audio_segment);
            $("#track-0").append(clip);

            clip.css({ "padding": 0, "width": "600", "height": $("#audio_timeline").height()/2 });
            clip.draggable({
                containment: "#track-0",
                axis: "x"
            })
            .resizable({handles: "e, w", minWidth: 1});

            
            //load waveform
            var wavesurfer = Object.create(WaveSurfer);
            console.log("#" + new_segment_id)

            wavesurfer.init({
                container: document.querySelector("#" + new_segment_id),
                waveColor: 'violet',
                progressColor: 'purple',
                height: $("#audio_timeline").height()/2
            });

            wavesurfer.on('ready', function () {
                wavesurfer.play();
            });

            wavesurfer.load(audio_segment.audio_resource);
        }

        // Test
        var test_audio_track = new Audio_track();
        var test_segment = new Audio_segment("clair_de_lune.mp3", 0, 500, 0, 500);
        console.log(test_audio_track);
        test_audio_track.audio_segments = [test_segment];
        create_audio_track(test_audio_track);
        create_audio_segment(test_segment);
    });
    //DEBUGGING PURPOSES ONLY

    lecture = new pentimento.lecture();
    console.log('lecture created');


};

