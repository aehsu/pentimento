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
                this.shift_segment( shift_segment , newSegment.lengthInTrack());
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
        };

        return true;
    };

	// Shifts the specified segment left or right by a certain number of milliseconds.
	// If a negative number is given for shift_millisec, then the shift will be left.
    // Return true if the shift succeeds
    // Otherwise, return the shift value of the greatest magnitude that would have produced a valid shift
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

    // Returns whether the specified segment can be cropped on the left or right
    // If a negative number is given for crop_millisec, then the crop will shrink the segment.
    // If a positive number is given for crop_millisec, then the crop will extend the segment.
    // The segment cannot overlap existing segments in the track.
    // The segment cannot extend past the audio length and cannot shrink below a length of 0.
    // left_side is a bool indicating whether the left side is being cropped.
    // Returns true if the crop is valid.
    // Otherwise, return a crop millisecond of the greatest magnitude that would have produced a valid crop.
    this.canCropSegment = function(segment, crop_millisec, left_side) {

        // Check that the segment exists in the track
        if (this.audio_segments.indexOf(segment) < 0) {
            return "segment does not exist";
        };

        // Get the old and new side for the segment. This is calculated differently depending on whether the
        // left or right side is being cropped.
        var oldSide;
        var newSide;
        var newLength;
        if (left_side === true) {  // left side
            // On the left side, a positive crop reduces the time of the side to expand the segment
            oldSide = segment.start_time;
            newSide = oldSide - crop_millisec;
            newLength = segment.end_time - newSide;
        } else {  // right side
            // On the right side, a positive crop increases the time of the side to expand the segment
            oldSide = segment.end_time;
            newSide = oldSide + crop_millisec;
            newLength = newSide - segment.start_time;
        };

        // Check to make sure the segment does not exceed the length of the audio clip and does not drop below 0.
        // If invalid, return the value of maximum magnitude that can be cropped
        if (newLength < 0) {
            return -segment.lengthInTrack();
        } else if (newLength > segment.audioLength()) {
            // TODO: fix return length here
            return segment.audioLength() - segment.lengthInTrack();
        };

        // Check for overlap with existing segments
        var minDiff = Number.MAX_VALUE;  // Always positive, distance between new side and end of last valid crop point
        for (var i = 0; i < this.audio_segments.length; i++) {
            var currentSegment = this.audio_segments[i];

            // Don't check against itself
            if (currentSegment === segment) {
                continue;
            };

            // Check that the current segment is not inside the area between the old and new side
            if (left_side === true && newSide < currentSegment.end_time && segment.end_time > currentSegment.end_time) {  // left side
                minDiff = Math.min(currentSegment.end_time - newSide, minDiff);

            } else if (newSide > currentSegment.start_time && segment.start_time < currentSegment.start_time) {  // right side
                minDiff = Math.min(newSide - currentSegment.start_time, minDiff);
            };
        }

        // If there was an overlap, then return the largest valid crop (positive number always)
        if (minDiff !== Number.MAX_VALUE) {
            return minDiff;
        };

        return true;
    };

	// Crop the specified segment by the specified number of milliseconds
	// If a negative number is given for crop_millisec, then the crop will shrink the segment side
    // left_side is a bool indicating whether the left side is being cropped.
    // Returns true if the crop is valid.
    // Otherwise, return a crop millisecond of the greatest magnitude that would have produced a valid crop.
	this.cropSegment = function(segment, crop_millisec, left_side) {

        // Check for validity of the crop
        var cropResult = this.canCropSegment(segment, crop_millisec, left_side);
        if (cropResult !== true) {
            return cropResult;
        };

        // Get the new times for the segment
        if (left_side === true) {  // left side
            // On the left side, a positive crop reduces the time of the side to expand the segment
            segment.start_time -= crop_millisec;

        } else {  // right side
            // On the right side, a positive crop increases the time of the side to expand the segment
            segment.end_time += crop_millisec;
        }
        console.log('segment after crop: ' + segment.start_time + " " + segment.end_time);
        return true;
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

// Audio segments contain an audio clip and a location within the track
pentimento.audio_segment = function(audio_resource, audio_length, track_start_time) {

    // Audio clip data
	var audio_resource = audio_resource;
    var total_audio_length = audio_length;

    // Specifies what part of the audio clip should be played back
	this.audio_start_time = 0;
	this.audio_end_time = audio_length;

    // Location of the segment within the track
	this.start_time = track_start_time;
	this.end_time = track_start_time + audio_length;

    this.audioResource = function() {
        return audio_resource;
    };

    this.totalAudioLength = function() {
        return total_audio_length;
    };

    this.lengthInTrack = function() {
        return this.end_time - this.start_time;
    };

    this.audioLength = function() {
        return this.audio_end_time - this.audio_start_time;
    };
};
