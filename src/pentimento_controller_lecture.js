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
    this.retimingController = new RetimingController(lecture);

    //utility
    this.setStateSlide = function() {
        var time = state.videoCursor;
        if(time==0) { state.currentSlide = lecture.getSlides()[0]; return; }
        var totalDuration=0;
        var slidesIter = lecture.getSlidesIterator();
        while(slidesIter.hasNext()) {
            var slide = slidesIter.next();
            if(time > totalDuration && time <= totalDuration+slide.getDuration()) {
                state.currentSlide = slide;
                return;
            } else {
                totalDuration += slide.getDuration();
            }
        }
    }

    //utility
    this.getLectureDuration = function() {
        var time = 0;
        var iter = lecture.getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            time += slide.getDuration();
        }
        return time;
    }

    // //recording mode function. undoing logic local to recording controller
    // this.unAddSlide = function(prevSlide, newSlide, index) {
    //     if(newSlide != state.currentSlide) { console.log('Error in unadding a slide!'); }
    //     var duration = 0;
    //     while(slideIter.hasNext()) {
    //         var slide = slideIter.next();
    //         if(slideIter.index == index) { break; }
    //         duration+= slide.getDuration();
    //     }
    //     pentimento.timeController.updateTime(duration);
    //     state.currentSlide = prevSlide;
    // }

    //recording mode function. undoing logic local to recording controller
    this.removeSlide = function(newSlide) {
        var slides = lecture.getSlides();
        var index = slides.indexOf(newSlide);

        slides.splice(index, 1);
    }
    
    //recording mode function. undoing logic local to recording controller
    this.addSlide = function(prevSlide, newSlide) {
        var slides = lecture.getSlides();
        var index = slides.indexOf(prevSlide);

        slides.splice(index+1, 0, newSlide);
    }

    this.shiftSlideDuration = function(slide, amount) {
        slide.setDuration(slide.getDuration() + amount);

        um.add(function() {
            self.shiftSlideDuration(slide, -1.0*amount);
        }, ActionTitles.ShiftSlide)
    }

    /**********************************EDITING OF LECTURE**********************************/
    function unDeleteSlide(slide, index, time) {
        lecture.getSlides().splice(index, 0, slide);
        var duration = 0;
        var slideIter = lecture.getSlidesIterator();
        while(slideIter.hasNext()) {
            var sl = slideIter.next();
            if(slideIter.index==index) { break; }
            duration += sl.getDuration();
        }
        pentimento.timeController.updateVideoTime(duration + time);
        //shift constraints

        um.add(function() {
            self.deleteSlide(slide);
        }, ActionTitles.DeleteSlide);
    }
    
    //edit mode function
    this.deleteSlide = function(slide) {
        if(lecture.getSlides().length==1) {
            throw {name:"DeleteSlideError", message:"Only one slide left, cannot delete!"}
        }
        var index = lecture.getSlides().indexOf(slide);
        if(index==-1) { console.log("Error in delete_slide for Lecture controller"); return; }

        lecture.getSlides().splice(index, 1);
        
        var duration = 0;
        var slideIter = lecture.getSlidesIterator();
        while(slideIter.hasNext()) {
            var sl = slideIter.next();
            if(slideIter.index == index) { break; }
            duration += sl.getDuration();
        }
        var slideTime = state.videoCursor - duration;
        pentimento.timeController.updateVideoTime(duration); //self.setStateSlide() implicit
        //shift constraints

        um.add(function() {
            unDeleteSlide(slide, index, slideTime);
        }, ActionTitles.DeleteSlide);
    }
}

pentimento.lecture = new Lecture();
pentimento.lectureController = new LectureController(pentimento.lecture);