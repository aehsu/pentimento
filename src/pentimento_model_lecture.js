/*************************************************
					MODEL
*************************************************/

//PUBLIC
pentimento.lecture = function() {
	this.slides = [];
	this.slide_changes = [];
	this.audio_tracks = [];
};


// Audio classes
pentimento.audio_track = function() {
	this.audio_segments = [];

	// Shifts the specified segment left or right by a certain number of milliseconds.
	// If a negative number is given for shift_millisec, then the shift will be left.
	// It modifies the lecture object passed in to it. Other segments will be shifted as a result.
	this.shift_segment = function(segment_idx, shift_millisec) {

	};

	// Crop the specified segment by the specified number of milliseconds
	// crop_left is a boolean indicating whether the left or right side will be cropped
	// It modifies the lecture object passed in to it. Other segments will be shifted as a result.
	this.crop_segment = function(segment_idx, crop_millisec, crop_left) {

	};

	// Scales the audio segment by the specified factor.
	// A factor from 0 to 1 shrinks, and a factor above 1 expands.
	// It modifies the lecture object passed in to it. The anchor point is the left hand side.
	// Other segments to the right will be shifted as a result.
	this.scale_segment = function(segment_idx, scale_factor) {

	};
}

pentimento.audio_segment = function(audio_resource, audio_start_time, audio_end_time, lecture_start_time, lecture_end_time) {
	this.audio_resource = audio_resource;
	this.audio_start_time = audio_start_time;
	this.audio_end_time = audio_end_time;
	this.audio_length = audio_end_time - audio_start_time;
	this.lecture_start_time = lecture_start_time;
	this.lecture_end_time = lecture_end_time;

// this.shift = function(x_shift) {
// 	this.slide.begin_time += x_shift * timeline_scale;
// 	this.slide.end_time += x_shift * timeline_scale;
// };

// this.resize = function(x_shift, side_shifted) {
// 	//need to restrict to constraints
// 	if (side_shifted === "left")
// 		this.audio_start_time += x_shift;
// 	else if (side_shifted === "right")
// 		this.audio_end_time += x_shift;
// };

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

