// Audio model contains all the tracks and segments that make up all of the audio data
// All audio model data should be modified only through the class methods provided.
pentimento.audio_model = function() {

    this.audio_tracks = [];

    // Create a new empty audio track and return it.
    this.createTrack = function() {
        var newTrack = new pentimento.audio_track();
        this.audio_tracks.push(newTrack);
        return newTrack;
    };

    // Remove the specified audio track
    this.removeTrack = function(track) {

    };
};

// Audio track contains non-overlapping audio segments
pentimento.audio_track = function() {

	this.audio_segments = [];

    // Insert the provided segment and return an array of new segments created
    // due to the insertion (can happen if the insert splits a segment).
    // Returns null if there are no new segments.
    this.insertSegment = function(newSegment) {

        // Iterate over all segments for the track
        for (var i = 0; i < this.audio_segments.length; i++) {
            var shift_segment = this.audio_segments[i];

            // If the segment is fully to the right of the inserted segment, then shift
            if ( newSegment.lecture_end_time <= shift_segment.lecture_start_time ) {
                this.shift_segment( shift_segment , newSegment.lectureLength());
            };
        };

        // Insert the segment
        this.audio_segments.push(newSegment);

        // TODO: handle if the insertion splits an existing segment
        return null;
    };

    // Remove the specified segment
    

    // Returns whether the specified segment can be shifted to the left or right
    // If a negative number is given for shift_millisec, then the shift will be left.
    // The final value of the segment starting time cannot be negative.
    // The segment cannot overlap existing segments in the track.
    // If the shift will cause either of these conditions to be true,
    // then the shift cannot occur.
    // Returns true if the shift is valid.
    this.canShiftSegment = function(segment_idx, shift_millisec) {

        // Get the segment and check that it exists
        var shiftSegment = this.audio_segments[segment_idx];
        if (shiftSegment === undefined) {
            return false;
        };

        // Get the new lecture start/end times and check for non-negative start time
        var newLectureStartTime = shiftSegment.lecture_start_time + shift_millisec;
        var newLectureEndTime = shiftSegment.lecture_end_time + shift_millisec;
        if (newLectureStartTime < 0) {
            return false;
        };

        // Check for overlap with existing segments
        for (var i = 0; i < this.audio_segments.length; i++) {
            var currentSegment = this.audio_segments[i];

            // The newLectureStartTime must be greater than currentSegment.lecture_end_time
            // or the newLectureEndTime must be less than currentSegment.lecture_start_time
            // Check for the inverse of this
            if (newLectureStartTime < currentSegment.lecture_end_time &&
                newLectureEndTime > currentSegment.lecture_start_time) {
                return false;
            };

            // Overlaps if newLectureStart/EndTime is inside the range of
            // (currentSegment.lecture_start_time, currentSegment.lecture_end_time)
            // if ( (newLectureStartTime > currentSegment.lecture_start_time &&
            //     newLectureStartTime < currentSegment.lecture_end_time) || 
            //     (newLectureEndTime > currentSegment.lecture_start_time &&
            //     newLectureEndTime < currentSegment.lecture_end_time) ) {
            //     return false;
            // };

            // Overlaps if any segment's start or end time is inside the range
            // of (newLectureStartTime, newLectureEndTime)
            // if ( () || () ) {
            //     return false;
            // };
        };

        return true;
    };

	// Shifts the specified segment left or right by a certain number of milliseconds.
	// If a negative number is given for shift_millisec, then the shift will be left.
    // checkValid specifies whether to if the shift is valid and defaults to true.
    // The segments will be rearranged so that they are still in order
    // Return the new index of the segment after the shift
    // Return -1 if the shift fails
	this.shift_segment = function(segment_idx, shift_millisec, checkValid) {
        if(typeof(checkValid)==='undefined') checkValid = true;

        // Get the segment and check that it exists
        var shiftSegment = this.audio_segments[segment_idx];
        if (shiftSegment === undefined) {
            return -1;
        };

        // Check for validity if specified
        if (checkValid) {
            var canShift = this.canShiftSegment(segment_idx, shift_millisec);
            if (!canShift) {
                return -1;
            };
        };

        // Get the new times for the segment
        var newLectureStartTime = shiftSegment.lecture_start_time + shift_millisec;
        var newLectureEndTime = shiftSegment.lecture_end_time + shift_millisec;

        // Remove the segment from the array
        this.audio_segments.splice(segment_idx, 1);

        // Figure out the index to reinsert the segment at by looping through the 
        // segments and stopping once the shifted segment is greater than a segment.
        // A starting insertIndex of 0 is used in case the shifted segment is less than
        // all of the current segments.
        var insertIndex = 0;
        for (var i = 0; i < this.audio_segments.length; i++) {
            // Once the begin time of the shifted segment is greater than the end time
            // of the current segment, then break at the current index plus one
            if (newLectureStartTime >= this.audio_segments[i].lecture_end_time) {
                insertIndex = i+1;
                break;
            };
        };

        // Splice the array of segments to insert the shifted segment
        this.audio_segments.splice(insertIndex, 0, shiftSegment);

        return insertIndex;
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

    // Get the end time in the lecture of the track in milliseconds
    // Returns -1 if the track is empty
    this.endTimeLecture = function() {
        if (this.audio_segments.length == 0) {
            return -1;
        };
        var lastSegment = this.audio_segments[this.audio_segments.length-1]
        return lastSegment.lecture_end_time;
    };
};

// Given the location where the segment is dropped, this function figures out where to place the audio
// segment and returns the new location in the track
pentimento.audio_track.place_segment =  function ( segment_idx, mouse_event ) {
    // Iterate over audio tracks in DOM
    $(".audio_segment").each(function(index, segment) {
    	// Don't check itself
    	if (index != segment_idx) {
    		// Check to see if it overlaps with segment on the left half
    		if ( mouse_event.pageX >= $(segment).offset().left && 
                mouse_event.pageX <= $(segment).offset().left + $(segment).width()/2 ) {
    		    console.log('move to left');
    		    // Move segment to the left of conflicting segment
    		   
    		}
    		// Check to see if it over laps with segment on the right half
    		else if ( mouse_event.pageX > $(segment).offset().left + $(segment).width()/2 && 
                mouse_event.pageX <= $(segment).offset().left + $(segment).width() ) {
    		    // Move segment to the left of conflicting segment
    		    console.log('move to right');
    		}
    	};
    });
};

// Audio segments contain an audio clip and a location within the lecture
pentimento.audio_segment = function(audio_resource, audio_start_time, audio_end_time, lecture_start_time, lecture_end_time) {

	this.audio_resource = audio_resource;
	this.audio_start_time = audio_start_time;
	this.audio_end_time = audio_end_time;
	this.lecture_start_time = lecture_start_time;
	this.lecture_end_time = lecture_end_time;

    this.lectureLength = function() {
        return this.lecture_end_time - this.lecture_start_time;
    }

    this.audioLength = function() {
        return this.audio_end_time - this.audio_start_time;
    }

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
