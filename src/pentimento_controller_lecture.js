//The convention is to include the duration for which slide you're on.
//For example, slides have these durations: [10, 10, 10, 10].
//Times [1-10] are for slide 0, [11-20] are for slide 1, [21-30] are for slide 2, [31-40] are for slide 3.
//Time 0 is treated special.

function LectureController(lec) {
    var self = this;
    var lecture = lec;
    var state = pentimento.state;
    state.currentSlide = new Slide();
    lecture.setSlides([state.currentSlide]); //every lecture object is initialized irrevocably with at least one slide

    this.visualsController = new VisualsController(lecture);
    // this.audioController = new AudioController(lecture);

    this.setStateSlide = function(time) { //questionable.
        // if(time==0) { state.currentSlide = lecture.slides[0]; return; }
        // var totalDuration=0;
        // for(var slide in lecture.slides) {
        //     if(time > totalDuration && time <= totalDuration+lecture.slides[slide].duration) {
        //         state.currentSlide = lecture.slides[slide];
        //         return;
        //     } else {
        //         totalDuration += lecture.slides[slide].duration;
        //     }
        // }
    }

    this.getLectureDuration = function() {
        var time = 0;
        var iter = lecture.getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            time += slide.getDuration();
        }
        return time;
    }

    this.endSlide = function(shift) {
        var originalDuration = state.currentSlide.getDuration();
        var slide = state.currentSlide;
        slide.setDuration(originalDuration + shift);

        um.addToStartOfGroup(ActionGroups.SlideGroup, function() {
            unEndSlide(shift);
        });
    }

    function unEndSlide(shift) {
        var originalDuration = state.currentSlide.getDuration();
        var slide = state.currentSlide;
        slide.setDuration(originalDuration + shift);

        var self = this;
        um.add(function() {
            self.endSlide(shift);
            //it's okay to reuse endSlice, since this action is always the first thing within a group
        }, ActionTitles.ShiftSlide)
    }

    function unaddSlide(prevSlide, newSlide, index) {
        if(newSlide != state.currentSlide) { console.log('Error in unadding a slide!'); }
//not delete        this.deleteSlide(newSlide);
//TODO FIXXXX

        var duration = 0;
        var slideIter = pentimento.lectureController.getLectureAccessor();
        
        while(slideIter.hasNext()) {
            var slide = slideIter.next();
            if(slideIter.index == index) { break; }
            duration+= slide.getDuration();
        }

        pentimento.timeController.updateTime(duration);
        state.currentSlide = prevSlide;
        updateVisuals();
        
        var self = this;
        um.add(function() {
            self.addSlide(newSlide);
        }, ActionTitles.AdditionOfSlide);
    }
    
    this.addSlide = function() {
        var prevSlide = state.currentSlide;
        var newSlide = new Slide();
        var slides = lecture.getSlides();
        var index = slides.indexOf(prevSlide);

        slides.splice(index+1, 0, newSlide);
        state.currentSlide = newSlide;

        um.add(function() {
            unaddSlide(prevSlide, newSlide, index);
        }, ActionTitles.AdditionOfSlide);
    }
    
    this.deleteSlide = function(slide) {
        // var index = lecture.slides.indexOf(slide);
        // if(index==-1) { console.log("Error in delete_slide for Lecture controller"); return; }

        // lecture.slides.splice(index, 1);
        // return index;
    }
}

pentimento.lecture = new Lecture();
pentimento.lectureController = new LectureController(pentimento.lecture);

$(document).ready(function() {
    if(DEBUG) {
        console.log('lecture created');
        var logger2 = $('<button>LOG-VISUALS</button>');
        // $(logger2).click();//
        $('body div:first').append(logger2);
    }
});