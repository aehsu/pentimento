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
            if ( newSegment.end_time <= shift_segment.start_time ) {
                this.shift_segment( shift_segment , newSegment.getLength());
            };
        };

        // Insert the segment
        this.audio_segments.push(newSegment);

        // TODO: handle if the insertion splits an existing segment
        return null;
    };

    // Remove the specified segment
    this.removeSegment = function() {
        // TODO
    };


    // Returns whether the specified segment can be shifted to the left or right
    // If a negative number is given for shift_millisec, then the shift will be left.
    // The final value of the segment starting time cannot be negative.
    // The segment cannot overlap existing segments in the track.
    // If the shift will cause either of these conditions to be true, then the shift cannot occur.
    // Returns true if the shift is valid.
    // Otherwise, return the shift value of the greatest magnitude that would have produced a valid shift
    this.canShiftSegment = function(segment, shift_millisec) {

        // Check that the segment exists in the track
        if (this.audio_segments.indexOf(segment) < 0) {
            return "segment does not exist";
        };

        // Get the new start/end times and check for non-negative start time.
        // Reture the start time as the greatest valid shift value.
        var newStartTime = segment.start_time + shift_millisec;
        var newEndTime = segment.end_time + shift_millisec;
        if (newStartTime < 0) {
            return segment.start_time;
        };

        // Check for overlap with existing segments
        for (var i = 0; i < this.audio_segments.length; i++) {
            var currentSegment = this.audio_segments[i];

            // Don't check against itself
            if (currentSegment === segment) {
                continue;
            };

            // The newStartTime must be greater than currentSegment.end_time
            // or the newEndTime must be less than currentSegment.start_time
            // Check for the inverse of this
            if (newStartTime < currentSegment.end_time &&
                newEndTime > currentSegment.start_time) {
                
                // Check if the segment moved left or right into the obstacle segment.
                if (segment.start_time > currentSegment.end_time && newStartTime > currentSegment.start_time) {  // left
                    // Greatest shift value for shifting to the left
                    return currentSegment.end_time - segment.start_time;
                }
                else { // right
                    // Greatest shift value for shifting to the right
                    return currentSegment.start_time - segment.end_time;
                };
            };

            // Overlaps if newStart/EndTime is inside the range of
            // (currentSegment.start_time, currentSegment.end_time)
            // if ( (newStartTime > currentSegment.start_time &&
            //     newStartTime < currentSegment.end_time) || 
            //     (newEndTime > currentSegment.start_time &&
            //     newEndTime < currentSegment.end_time) ) {
            //     return false;
            // };

            // Overlaps if any segment's start or end time is inside the range
            // of (newStartTime, newEndTime)
            // if ( () || () ) {
            //     return false;
            // };
        };

        return true;
    };

	// Shifts the specified segment left or right by a certain number of milliseconds.
	// If a negative number is given for shift_millisec, then the shift will be left.
    // Return true if the shift succeeds
	this.shiftSegment = function(segment, shift_millisec) {

        // Check for validity of the shift
        var shiftResult = this.canShiftSegment(segment, shift_millisec);
        if (shiftResult !== true) {
            return shiftResult;
        };

        // Get the new times for the segment
        segment.start_time += shift_millisec;
        segment.end_time += shift_millisec;

        return true;
	};

	// Crop the specified segment by the specified number of milliseconds
	// crop_left is a boolean indicating whether the left or right side will be cropped
	// Other segments will be shifted as a result.
	this.crop_segment = function(segment, crop_millisec, crop_left) {

	};

	// Scales the audio segment by the specified factor.
	// A factor from 0 to 1 shrinks, and a factor above 1 expands.
	// The anchor point is the left hand side.
	// Other segments to the right will be shifted as a result.
	this.scale_segment = function(segment, scale_factor) {

	};

    // Get the end time of the track in milliseconds
    // Returns 0 if the track is empty
    this.endTime = function() {

        // Iterate over all the segments in the track and get the greatest time
        var timeEnd = 0;
        for (var i = 0; i < this.audio_segments.length; i++) {
            timeEnd = Math.max(this.audio_segments[i].end_time, timeEnd);
        };
        return timeEnd;
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

// Audio segments contain an audio clip (audio_resource, audio_start_time, audio_end_time)
// and a location within the lecture (start_time, end_time)
pentimento.audio_segment = function(audio_resource, audio_start_time, audio_end_time, start_time, end_time) {

	this.audio_resource = audio_resource;
	this.audio_start_time = audio_start_time;
	this.audio_end_time = audio_end_time;
	this.start_time = start_time;
	this.end_time = end_time;

    this.getLength = function() {
        return this.end_time - this.start_time;
    }

    this.getAudioLength = function() {
        return this.audio_end_time - this.audio_start_time;
    }
};
