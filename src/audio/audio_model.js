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
    // If the shift will cause either of these conditions to be true,
    // then the shift cannot occur.
    // Returns true if the shift is valid.
    this.canShiftSegment = function(segment_idx, shift_millisec) {

        // Get the segment and check that it exists
        var shiftSegment = this.audio_segments[segment_idx];
        if (shiftSegment === undefined) {
            return false;
        };

        // Get the new start/end times and check for non-negative start time
        var newStartTime = shiftSegment.start_time + shift_millisec;
        var newEndTime = shiftSegment.end_time + shift_millisec;
        if (newStartTime < 0) {
            return false;
        };

        // Check for overlap with existing segments
        for (var i = 0; i < this.audio_segments.length; i++) {
            var currentSegment = this.audio_segments[i];

            // The newStartTime must be greater than currentSegment.end_time
            // or the newEndTime must be less than currentSegment.start_time
            // Check for the inverse of this
            if (newStartTime < currentSegment.end_time &&
                newEndTime > currentSegment.start_time) {
                return false;
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
        var newStartTime = shiftSegment.start_time + shift_millisec;
        var newEndTime = shiftSegment.end_time + shift_millisec;

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
            if (newStartTime >= this.audio_segments[i].end_time) {
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
	// Other segments will be shifted as a result.
	this.crop_segment = function(segment_idx, crop_millisec, crop_left) {

	};

	// Scales the audio segment by the specified factor.
	// A factor from 0 to 1 shrinks, and a factor above 1 expands.
	// The anchor point is the left hand side.
	// Other segments to the right will be shifted as a result.
	this.scale_segment = function(segment_idx, scale_factor) {

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
