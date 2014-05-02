//The convention is to include the duration for which slide you're on.
//For example, slides have these durations: [10, 10, 10, 10].
//Times [1-10] are for slide 0, [11-20] are for slide 1, [21-30] are for slide 2, [31-40] are for slide 3.
//Time 0 is treated special.

function LectureController(lecture) {
    var self = this;
    var _lecture = lecture;
    var state = pentimento.state;//Time 0 is treated special.
    state.current_slide = new Slide();
    _lecture.slides.push(state.current_slide); //manual initialization, prevents undoing to no slide.
    
    this.visuals_controller = new VisualsController(lecture);
//    var _audio_controller = new AudioController(lecture);

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
    
    this.addSlide = function(slide) {
        var index = _lecture.slides.indexOf(state.current_slide);
        _lecture.slides.splice(index, 0, slide);
        return index;
    }
    
    this.deleteSlide = function(slide) {
        var index = _lecture.slides.indexOf(slide);
        if(index==-1) { console.log("Error in delete_slide for Lecture controller"); return; }

        _lecture.slides.splice(index, 1);
        return index;
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