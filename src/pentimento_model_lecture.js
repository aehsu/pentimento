/*************************************************
					MODEL
*************************************************/
function Slide() {
    this.visuals = [];
    this.duration = 0;
    
    this.access = function() {
        var self = this;
        
        return {
            visuals: function() { return new Iterator(self.visuals); },
            duration: function() { return self.duration; }
        };
    };
};

function Constraint() {
    this.tVis;
    this.tAud;
}

function Matrix() {
    //TODO
}

function Transform() {
    this.tMin;
    this.duration; //necessary?
    this.matrix;
}

function Lecture() {
    this.slides = []; //every lecture is by default, initialized with at least one slide
    this.audio_tracks = [];
    this.constraints = [];
    this.transforms = [];
    
    this.access = function() {
        var self = this;
//        var slide_accessors = [];
//        for(var sli in self.slides) { slide_accessors.push(self.slides[sli].access()); }
        return {
            slides: function() { return new Iterator(self.slides); },
            constraints: function() { return new Iterator(self.constraints); }
            //audio
        };
    };
};

// Audio classes
var Audio_track = function() {
	this.audio_segments = [];
}

var Audio_segment = function(audio_resource, audio_start_time, audio_end_time, lecture_start_time, lecture_end_time){
	this.audio_resource = audio_resource;
	this.audio_start_time = audio_start_time;
	this.audio_end_time = audio_end_time;
	this.audio_length = audio_end_time - audio_start_time;
	this.lecture_start_time = lecture_start_time;
	this.lecture_end_time = lecture_end_time;

	//these should probably be moved elsewhere, you're mixing controller logic with model data
	this.delete = function(audio_start_time, audio_end_time) {

	};

	this.shift = function(x_shift) {
		this.slide.begin_time += x_shift * timeline_scale;
		this.slide.end_time += x_shift * timeline_scale;
	};

	this.resize = function(x_shift, side_shifted) {
		//need to restrict to constraints
		if (side_shifted === "left")
			this.audio_start_time += x_shift;
		else if (side_shifted === "right")
			this.audio_end_time += x_shift;
	};

	this.play_audio = function() {
		// Need to handle event listener removal after playing
		this.addEventListener('timeupdate', function() {
			if (this.audio_end_time && currentTime >= audio_end_time) {
				this.audio.pause();
			};

		}, false);
		this.audio.currentTime = this.audio_start_time;
		this.audio.play();
	};
};

