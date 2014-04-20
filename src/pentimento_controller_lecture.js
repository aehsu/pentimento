pentimento.lecture_controller = new function() {
    var _lecture = new Lecture(); _lecture.slides.push(new Slide()); //initialize every lecture with one empty slide
    pentimento.visuals_controller.set_lecture(_lecture);
    var state = pentimento.state;
    var recording_params;
    var group_name = "Lecture_Controller_Group";
//    var audio_timeline_scale = 100;
//    state.wavesurfer = Object.create(WaveSurfer);

    this.set_slide_by_time = function(time) {
        //this should be changed to something...but not sure what
        var total_duration=0;
        for(var slide in _lecture.slides) {
            if(time >= total_duration && time < total_duration+lecture.slides[slide].duration) {
                state.current_slide = _lecture.slides[slide];
                return;
            } else {
                total_duration += _lecture.slides[slide].duration;
            }
        }
    }

    this.get_lecture_duration = function() {
        var time = 0;
        for(var slide in _lecture.slides) {
            time += _lecture.slides[slide].duration;
        }
        return time;
    }

    this.begin_recording = function() {
        var split_slide = 0;
        var split_time = 0;
        
        var total_duration = 0;
        for(var slide in _lecture.slides) { //something...equals...something...
            if (state.current_time >= total_duration && state.current_time < total_duration+_lecture.slides[slide].duration) {
                split_slide = slide;
                split_time = state.current_time - total_duration;
                break;
            } else {
                total_duration += _lecture.slides[slide].duration;
            }
        }
        recording_params = {
            index: split_slide, 
            split: split_time
        };
    }

//    this.create_audio_track = function(audio_track) {
//        var new_track_id = "track-" + $("#audio_timeline").children(".audio_track").length;
//        var new_track = $('<div></div>').attr({"id": new_track_id , "class": "audio_track"});
//        new_track.data(audio_track);
//        $("#audio_timeline").append(new_track);
//    };

//    this.create_audio_segment = function(audio_segment) {
//        var new_segment_id = "segment-" + $("#track-0").children(".audio_segment").length;
//        var clip = $("<div></div>").attr({"id": new_segment_id, "class": "audio_segment"}).data(audio_segment);
//        $("#track-0").append(clip);
//
//        clip.css({ "padding": 0, "width": (audio_segment.end_time - audio_segment.start_time)*audio_timeline_scale, "height": $("#audio_timeline").height()/2 });
//        
//        // Dragging
//        clip.draggable({
//            containment: "#track-0",
//            axis: "x"
//        }).on( "dragstop", function( event, ui ) { // check to see if segment was dragged to an end of another segment
//            // for ( var segment in $("#track-0").children(".audio_segment")) {
//            //     if event.clientX === (segment.position().left + segment.width())
//            //         // Call shift function in model
//            // };
//        }).resizable({
//            handles: "e, w",
//            minWidth: 1,
//            stop: function( event, ui ) {
//                dwidth = ui.originalSize.width - ui.size.width;
//                if (ui.position.left === ui.originalPosition.left) // then right handle was used
//                    audio_segment.resize(dwidth, "right");
//                else
//                    audio_segment.resize(dwidth, "left");
//            }
//
//
//        });
//
//        //load waveform
//        var wavesurfer = Object.create(WaveSurfer);
//        console.log("#" + new_segment_id)
//
//        wavesurfer.init({
//            container: document.querySelector("#" + new_segment_id),
//            waveColor: 'violet',
//            progressColor: 'purple',
//            height: $("#audio_timeline").height()/2
//        });
//
//        wavesurfer.on('ready', function () {
//            wavesurfer.play();
//        });
//
//        wavesurfer.load(audio_segment.audio_resource);
//    }

    function insert_slide_into_slide(to_slide, from_slide, insertion_time) {
        //insertion time is in the to_slide
        pentimento.visuals_controller.shift_visuals(to_slide, from_slide, insertion_time);
        
        for(var vis in from_slide.visuals) {
            var visual = from_slide.visuals[vis];//$.extend({}, from_slide.visuals[vis], true); //make a deep copy
            visual.tMin += insertion_time;
            to_slide.visuals.push(visual);
        }
        to_slide.duration += from_slide.duration;
    }

    this.insert_recording = function(recording) {
        //begin GROUP!
        
        var total_recording_time = 0;
        for(var slide in recording.slides) { total_recording_time += recording.slides[slide].duration; }

        var slide = _lecture.slides[recording_params.index];
        var merge_slide = recording.slides.shift();
        insert_slide_into_slide(slide, merge_slide, recording_params.split);

        var before = [];
        var after = _lecture.slides;
        for(var i=0; i<=recording_params.slide_idx; i++) {
            before.push(after.shift());
        } //separate slides to before and after those to be inserted
        _lecture.slides = before.concat(recording.slides.concat(after)); //concat does not modify
        
        state.current_time += total_recording_time;
        state.current_slide = recording.slides[recording.slides.length-1];
        //ticker gets updated by the call from controller_tools
        //end GROUP! um undo stuff put here
    }
    
    if(DEBUG) {
        pentimento.lecture = _lecture;
    }

    this.log_lecture = function() {
        console.log(_lecture);
    }

    this.log_visuals = function() {
        console.log(state.current_slide.visuals);
        window.viz = state.current_slide.visuals;
    }
};

$(document).ready(function() {
    if(DEBUG) {
        console.log('lecture created');
        var logger = $('<button>LOG-LECTURE</button>');
        $(logger).click(pentimento.lecture_controller.log_lecture);
        $('body div:first').append(logger);

        var logger2 = $('<button>LOG-VISUALS</button>');
        $(logger2).click(pentimento.lecture_controller.log_visuals);
        $('body div:first').append(logger2);
    }
});