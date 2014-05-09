/*************************************************
					MODEL
*************************************************/

//PUBLIC
pentimento.lecture = function() {
	this.slides = [];
	this.slide_changes = [];
	this.audio_tracks = [];

    this.get_slides_length = function() {
        return lecture.slides.length;
    }

    this.get_slide = function(index) {
        return lecture.slides[index];
    }

    this.get_duration = function() {
        var time = 0;
        for(slide in lecture.slides) {
            time += lecture.slides[slide].duration;
        }
        return time;
    }
};

