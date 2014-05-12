//The convention is to include the duration for which slide you're on.
//For example, slides have these durations: [10, 10, 10, 10].
//Times [1-10] are for slide 0, [11-20] are for slide 1, [21-30] are for slide 2, [31-40] are for slide 3.
//Time 0 is treated special.

function LectureController() {
    //Every lecture object is initialized irrevocably with at least one slide
    var self = this;
    var lecture = new Lecture();
    var state = pentimento.state;
    state.currentSlide = new Slide();
    lecture.slides.push(state.currentSlide);
    
    this.visualsController = new VisualsController(lecture);
    // this.audioController = new AudioController(lecture);

    this.setStateSlide = function(time) { //questionable.
        if(time==0) { state.currentSlide = lecture.slides[0]; return; }
        var totalDuration=0;
        for(var slide in lecture.slides) {
            if(time > totalDuration && time <= totalDuration+lecture.slides[slide].duration) {
                state.currentSlide = lecture.slides[slide];
                return;
            } else {
                totalDuration += lecture.slides[slide].duration;
            }
        }
    }

    this.getLectureDuration = function() {
        var time = 0;
        for(var slide in lecture.slides) {
            time += lecture.slides[slide].duration;
        }
        return time;
    }
    
    this.getLectureAccessor = function() {
        return lecture.access();
    }
    
    this.addSlide = function(slide) {
        var index = lecture.slides.indexOf(state.currentSlide);
        lecture.slides.splice(index, 0, slide);
        return index;
    }
    
    this.deleteSlide = function(slide) {
        var index = lecture.slides.indexOf(slide);
        if(index==-1) { console.log("Error in delete_slide for Lecture controller"); return; }

        lecture.slides.splice(index, 1);
        return index;
    }
    
    if(DEBUG) {
        pentimento.lecture = lecture;
    }

    this.logLecture = function() {
        console.log(lecture);
    }

    this.logVisuals = function() {
        console.log(state.currentSlide.visuals);
        window.viz = state.currentSlide.visuals;
    }
}

pentimento.lectureController = new LectureController();

$(document).ready(function() {
    if(DEBUG) {
        console.log('lecture created');
        var logger = $('<button>LOG-LECTURE</button>');
        $(logger).click(pentimento.lectureController.logLecture);
        $('body div:first').append(logger);

        var logger2 = $('<button>LOG-VISUALS</button>');
        $(logger2).click(pentimento.lectureController.logVisuals);
        $('body div:first').append(logger2);
    }
});