// Audio track contains non-overlapping audio segments
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
};

// Given the location where the segment is dropped, this function figures out where to place the audio
// segment and returns the new location in the track
pentimento.audio_track.place_segment =  function ( segment_idx, mouse_event ) {
    // Iterate over audio tracks in DOM
    $(".audio_segment").each(function(index, segment) {
    	// Don't check itself
    	if (index === segment_idx) {
    		return false;
    	};

        // Check to see if it overlaps with segment on the left half
        if ( mouse_event.pageX >= $(segment).offset().left && mouse_event.pageX <= $(segment).offset().left + $(segment).width()/2 ) {
            console.log('move to left');
            // Move segment to the left of conflicting segment
           
        }
        // Check to see if it over laps with segment on the right half
        else if ( mouse_event.pageX > $(segment).offset().left + $(segment).width()/2 && mouse_event.pageX <= $(segment).offset().left + $(segment).width() ) {
            // Move segment to the left of conflicting segment
            console.log('move to right');
        }

    });
};

// Audio segments contain an audio clip and a location within the lecture
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
