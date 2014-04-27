//The convention is to include the duration for which slide you're on.
//For example, slides have these durations: [10, 10, 10, 10].
//Times [1-10] are for slide 0, [11-20] are for slide 1, [21-30] are for slide 2, [31-40] are for slide 3.
//Time 0 is treated special.

function LectureController(lecture) {
    var _lecture = lecture;
    this.visuals_controller = new VisualsController(lecture);
//    var _audio_controller = new AudioController(lecture);
    var state = pentimento.state;//Time 0 is treated special.
    var group_name = "Lecture_Controller_Group";
//    var audio_timeline_scale = 100;
//    state.wavesurfer = Object.create(WaveSurfer);

    this.set_state_slide = function(time) { //questionable.
        if(time==0) { state.current_slide = _lecture.slides[0]; return; }
        var total_duration=0;
        for(var slide in _lecture.slides) {
            if(time > total_duration && time <= total_duration+_lecture.slides[slide].duration) {
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
    
    this.get_lecture_accessor = function() {
        return _lecture.access();
    }
    
    this.add_slide = function(slide) {
        _lecture.slides.push(slide);
        var self = this;
        
        um.add(function() {
            self.delete_slide(slide);
        }, group_name);
    }
    
    this.delete_slide = function(slide) {
        var idx = _lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in delete_slide for Lecture controller"); return; }

        _lecture.slides.splice(idx, 1);
        var self = this;
        
        um.add(function() {
            self.add_slide(slide);
        }, group_name);
    }
    
    this.accept_recording = function(recording, params) {
        //recording is a raw lecture object, instead of a controller
        if(state.current_slide != params.slide) { console.log('some kind of inconsistency in accept_recording'); return; }
        var idx = _lecture.slides.indexOf(params.slide);
        var running_duration = 0;
        for(var i=0; i<idx; i++) { running_duration += _lecture.slides[i].duration; }
        
        var excised_slide = _lecture.slides.splice(idx, 1)[0];
        if(excised_slide!=undefined) {
            for(var vis in excised_slide.visuals) {
                var visual = $.extend(true, {}, excised_slide.visuals[vis]); //deep copy
                if(visual.tMin < params.time - running_duration) {
                    recording.slides[0].splice(vis, 0, visual);
                } else if(visual.tMin > params.time - running_duration) {
                    visual.tMin += recording.slides[0].duration;
                    recording.slides[0].push(visual);
                }
            }
            recording.slides[0].duration += excised_slide.duration;
        }
        
        for(var sl in recording.slides) {
            _lecture.slides.splice(idx+sl, 0, recording.slides[sl]);
        }
        
        //TODO need, black magic. need to move to beginning.
        um.add(function() {
            reject_recording(recording, params, excised_slide)
        }, group_name);
    }
    
    function reject_recording(recording, params, excised_slide) {
        var idx = _lecture.slides.indexOf(recording.slides[0]);
        if(idx==-1) { console.log('something went terribly wrong in the rejection of a recording'); return; }
        _lecture.slides.splice(idx, recording.slides.length, excised_slide);
        
        var self = this;
        um.add(function() {
            self.accept_recording(recording, params);
        }, group_name);
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
}

pentimento.lecture_controller = new LectureController(new Lecture());

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