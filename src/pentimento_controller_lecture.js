pentimento.lecture_controller = new function() {
    var lecture;
    var state = pentimento.state;
    var interval;
    var audio_timeline_scale = 100;
    state.wavesurfer = Object.create(WaveSurfer);

    this.begin_recording = function() {
        console.log("begin_recording");
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

    this.get_slide_duration = function(index) {
        return lecture.slides[index].duration;
    }

    this.get_slide_from_time = function(time) { //returns a copy; makes original immutable. necessary???
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

    this.get_lecture_duration = function() {
        var time = 0;
        for(slide in lecture.slides) {
            time += lecture.slides[slide].duration;
        }
        return time;
    }

    this.rewind = function() {
        //should really seek a more previous slide change
        var idx = lecture.slides.indexOf(state.current_slide);
        var t = 0;
        for(var i=0; i<idx; i++) {
            t += lecture.slides[i].duration;
        }
        state.current_time = t+1;//so hackish
    }

    this.full_rewind = function() {
        state.current_time = 0;
        //check if slide
        state.current_slide = lecture.slides[0];
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
        var before_visuals = [];
        var after_visuals = to_slide.visuals;

        while(after_visuals.length!=0 && after_visuals[0].tMin < insertion_time) {
            before_visuals.push(after_visuals.shift());
        }
        $.each(after_visuals, function(index, value) {//shift
            value.tMin += from_slide.duration;
        });
        $.each(from_slide.visuals, function(index, value) {
            value.tMin += insertion_time;
        })
        to_slide.visuals = before_visuals.concat(from_slide.visuals.concat(after_visuals));
        to_slide.duration += from_slide.duration;
    }

    this.create_audio_track = function(audio_track) {
        var new_track_id = "track-" + $("#audio_timeline").children(".audio_track").length;
        var new_track = $('<div></div>').attr({"id": new_track_id , "class": "audio_track"});
        new_track.data(audio_track);
        $("#audio_timeline").append(new_track);
    };

    this.create_audio_segment = function(audio_segment) {
        var new_segment_id = "segment-" + $("#track-0").children(".audio_segment").length;
        var clip = $("<div></div>").attr({"id": new_segment_id, "class": "audio_segment"}).data(audio_segment);
        $("#track-0").append(clip);

        clip.css({ "padding": 0, "width": (audio_segment.end_time - audio_segment.start_time)*audio_timeline_scale, "height": $("#audio_timeline").height()/2 });
        
        // Dragging
        clip.draggable({
            containment: "#track-0",
            axis: "x"
        }).on( "dragstop", function( event, ui ) { // check to see if segment was dragged to an end of another segment
            // for ( var segment in $("#track-0").children(".audio_segment")) {
            //     if event.clientX === (segment.position().left + segment.width())
            //         // Call shift function in model
            // };
        }).resizable({
            handles: "e, w",
            minWidth: 1,
            stop: function( event, ui ) {
                dwidth = ui.originalSize.width - ui.size.width;
                if (ui.position.left === ui.originalPosition.left) // then right handle was used
                    audio_segment.resize(dwidth, "right");
                else
                    audio_segment.resize(dwidth, "left");
            }


        });

        
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

        pentimento.state.current_slide = this.get_slide_from_time(pentimento.state.current_time);
    }

};


//DEBUGGING PURPOSES ONLY
function log_lecture() {
    console.log(lecture);
    window.lec = lecture;
}

$(document).ready(function() {
    lecture = new pentimento.lecture();
    console.log('lecture created');
    
    var logger = $('<button>LOG-LECTURE</button>');
    $(logger).click(log_lecture);
    $('body div:first').append(logger);

    // Test
    // var test_audio_track = new Audio_track();
    // var test_segment = new Audio_segment("clair_de_lune.mp3", 0, 500.0, 0, 500.0);
    // test_audio_track.audio_segments = [test_segment];
    // create_audio_track(test_audio_track);
    // create_audio_segment(test_segment);
    // Bind buttons and keypresses

});
//DEBUGGING PURPOSES ONLY

