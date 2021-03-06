///////////////////////////////////////////////////////////////////////////////
// Audio Model
//
// Audio model contains all the tracks and segments that make up all of the audio data
// All audio model data should be modified only through the class methods provided.
// All methods that modify the audio also push the inverse action onto the undo manager.
"use strict";
var AudioModel = function() {
    var self = this;
    var audio_tracks = [new AudioTrack()];  // Starts with one track

    // Get the audio tracks
    this.getAudioTracks = function() {
        return audio_tracks;
    };

    // Set the audio tracks
    this.setAudioTracks = function(tracks) {
        audio_tracks = tracks;
    };

    // Add the track to the end of the audio tracks
    // Optionally take the index where the track should be inserted.
    this.addTrack = function(track, insert_index) {

        // Set the insert index to the end of the tracks if it was undefined
        if (typeof insert_index === 'undefined') {
            insert_index = audio_tracks.length;
        };

        // Check the bounds of the index
        if (insert_index < 0 || insert_index > audio_tracks.length) {
            return false;
        };

        // Splice the new track
        audio_tracks.splice(insert_index, 0, track);

        // For the undo action, remove the track
        undoManager.registerUndoAction(self, self.removeTrack, [track]);

        return true;
    };

    // Remove the specified audio track
    this.removeTrack = function(track) {

        // Check that there are at least two tracks, so that there will be at least
        // one track remaining after the delete.
        if (audio_tracks.length < 2) {
            return false;
        };

        // Find the index of the track to be removed
        var index = audio_tracks.indexOf(track);

        // Remove the track from the tracks array if it exists
        if (index > -1) {
            audio_tracks.splice(index, 1);
        };

        // For the undo action, add the track
        undoManager.registerUndoAction(self, self.addTrack, [track, index]);

        return (index > -1);
    };

    // Get the total duration of the audio, which is the max of the all audio track lengths
    // Returns the duration in milliseconds (0 if there are no tracks)
    this.getDuration = function() {
        var duration = 0;
        for (var i = 0; i < audio_tracks.length; i++) {
            duration = Math.max(duration, audio_tracks[i].endTime());
        };
        return duration;
    };

    // Get an array of all the unique audio blob URLs
    this.getBlobURLs = function() {
        var unique_urls = [];

        // Iterate over all segments in all tracks
        for (var i = 0; i < audio_tracks.length; i++) {
            var audio_segments = audio_tracks[i].getAudioSegments();
            for (var j = 0; j < audio_segments.length; j++) {

                // Push the URL if it is not in the array already
                var url = audio_segments[j].audioResource();
                if (unique_urls.indexOf() < 0) {
                    unique_urls.push(url);
                };
            };
        };

        return unique_urls;
    };

    // Saving the model to JSON.
    // Returns a JSON string
    this.saveToJSON = function() {
        var json_object = {
            audio_tracks: []
        };

        // Get the audio URLS so that the segments' audio clip URL can be replaced
        // with an index number instead. This index number will be used as the filename base.
        var audio_blob_urls = self.getBlobURLs();

        // For each track, add it to the JSON audio tracks
        for (var i = 0; i < audio_tracks.length; i++) {
            var json_track = audio_tracks[i].saveToJSON();
            json_object['audio_tracks'].push(json_track);

            // Also, process the segments in the track so that the
            // audio clip is the index of the URL in the getBlobURLs() array.
            var json_segments = json_track['audio_segments'];
            for (var i = 0; i < json_segments.length; i++) {
                var audio_index = audio_blob_urls.indexOf(json_segments[i]['audio_clip']);
                if (audio_index < 0) {
                    console.error('audio clip URL not found in array');
                };
                json_segments[i]['audio_clip'] = audio_index;
            };
        };

        return json_object;
    };
};
// Loading the model from JSON
AudioModel.loadFromJSON = function(json_object) {

    var audio_model = new AudioModel();

    // The JSON object is an array containing the JSON track objects.
    // Get the track object from JSON and add it to the array of tracks.
    var json_tracks = json_object['audio_tracks'];
    var audio_tracks = [];
    for (var i = 0; i < json_tracks.length; i++) {
        var track = AudioTrack.loadFromJSON(json_tracks[i])
        audio_tracks.push(track);
    };
    audio_model.setAudioTracks(audio_tracks);

    return audio_model;
};

///////////////////////////////////////////////////////////////////////////////
// Audio Track
//
// Audio track contains non-overlapping audio segments
var AudioTrack = function() {
    var self = this;
	var audio_segments = [];

    // Get the audio segments
    this.getAudioSegments = function() {
        return audio_segments;
    };

    // Set the audio segments
    this.setAudioSegments = function(segments) {
        audio_segments = segments;
    };

    // Insert the provided segment.
    // Another segments in the track may be split if the segment.
    // Returns true if the insert succeeds, unless a split occured.
    // If a split occurs, returns an object {left, right, remove} with the left and right side of the 
    // split segment, and the segment that was removed to become the left and right parts.
    this.insertSegment = function(new_segment, do_shift_split) {

        // Use a grouping because many actions are performed in order to insert a segment.
        // This method does not directly modify the audio segments. Instead, it uses
        // othes modifying methods to perform those actions. By using a group, we can
        // combine the undo for all of those actions.
        undoManager.beginGrouping();

        // Iterate over all segments for the track to see if the new segment's start time
        // intersects any segments.
        var intersect_segment = null;
        var left_segment = null;
        var right_segment = null;
        for (var i = 0; i < audio_segments.length; i++) {
            var other_segment = audio_segments[i];

            // If the new segment's start time intersects a segment, then split the segment into left and right
            if (new_segment.start_time > other_segment.start_time && 
                new_segment.start_time < other_segment.end_time ) {

                var split_result = other_segment.splitSegment(new_segment.start_time);
                if (!split_result) {
                    console.error('could not split segment');
                };
                intersect_segment = other_segment;
                left_segment = split_result.left;
                right_segment = split_result.right;

                // Remove the intersected segment and push the left and right parts
                // Do the insert manually instead of using the insert method because the insert method
                // will also shift all the segments behind it, effictively shifting those segments multiple times.
                self.removeSegment(intersect_segment);
                addSegment(left_segment);
                addSegment(right_segment);

                // Stop searching segments after the intersection is found.
                break;
            };
        };

        // Iterate over all segments for the track to shift the segment if it is after the new segment
        for (var i = 0; i < audio_segments.length; i++) {
            var shift_segment = audio_segments[i];

            // If the segment's end time is to the right of the inserted segment's begin time, then shift
            if ( new_segment.start_time < shift_segment.end_time ) {
                self.shiftSegment(shift_segment, new_segment.lengthInTrack(), false);
            };
        };

        // Insert the new segment
        addSegment(new_segment);

        // Return true if the insert succeeded, or return the relevant segments if an insert occured
        var returnValue;
        if (!intersect_segment) {
            returnValue = true;
        } else {
            returnValue = { left: left_segment, right: right_segment, remove: intersect_segment };
        };

        // End the grouping
        undoManager.endGrouping();

        return returnValue;
    };

    // Add the segment to the audio segments array without checking for validity
    var addSegment = function(segment) {

        audio_segments.push(segment);

        // For the undo action, remove the added segment
        undoManager.registerUndoAction(self, self.removeSegment, [segment]);
    };

    // Remove the specified segment. 
    // Returns true if the segment was removed.
    this.removeSegment = function(segment) {
        // Find the index of the segment to be removed
        var index = audio_segments.indexOf(segment);

        // Remove the segment from the segments array if it exists
        if (index < 0) {
            return false;
        };
        audio_segments.splice(index, 1);

        // For the undo action, add the removed segment
        undoManager.registerUndoAction(self, addSegment, [segment]);

        return true;
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
        if (audio_segments.indexOf(segment) < 0) {
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
        for (var i = 0; i < audio_segments.length; i++) {
            var currentSegment = audio_segments[i];

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
    // 'check' is optional and defaults to true. If false, it will shift without checking for validity
    // Return true if the shift succeeds
    // Otherwise, return the shift value of the greatest magnitude that would have produced a valid shift
	this.shiftSegment = function(segment, shift_millisec, check) {

        // Check for validity of the shift unless otherwise specified
        if (check !== false) {
            var shiftResult = self.canShiftSegment(segment, shift_millisec);
            if (shiftResult !== true) {
                return shiftResult;
            };
        };

        // Get the new times for the segment
        segment.start_time += shift_millisec;
        segment.end_time += shift_millisec;

        // For the undo action, reverse shift the segment. Don't check for validity.
        undoManager.registerUndoAction(self, self.shiftSegment, [segment, -shift_millisec, false]);

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
        if (audio_segments.indexOf(segment) < 0) {
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

        // Check to make sure the segment does not drop below 0.
        // If invalid, return the value of maximum magnitude that can be cropped
        if (newLength < 0) {
            return -segment.lengthInTrack();
        }; 

        // Check to make sure that the segment will not be expanded to exceed the bounds of the audio resource.
        if (left_side === true && newSide < segment.audioToTrackTime(0)) {  // left side
            console.log("left side exceed: newSide: " + newSide);
            return crop_millisec - (segment.audioToTrackTime(0) - newSide);
        } else if (newSide > segment.audioToTrackTime(segment.totalAudioLength()) ) { // right side
            console.log("right side exceed: newSide: " + newSide);
            return crop_millisec - (newSide - segment.audioToTrackTime(segment.totalAudioLength()) );
        };

        // Check for overlap with existing segments
        var minDiff = Number.MAX_VALUE;  // Always positive, distance between new side and end of last valid crop point
        for (var i = 0; i < audio_segments.length; i++) {
            var currentSegment = audio_segments[i];

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
    // 'check' is optional and defaults to true. If false, it will crop without checking for validity.
    // Returns true if the crop is valid.
    // Otherwise, return a crop millisecond of the greatest magnitude that would have produced a valid crop.
	this.cropSegment = function(segment, crop_millisec, left_side, check) {

        // Check for validity of the crop
        if (check !== false) {
            var cropResult = self.canCropSegment(segment, crop_millisec, left_side);
            if (cropResult !== true) {
                return cropResult;
            };
        };

        // Get the new times for the segment
        if (left_side === true) {  // left side
            // On the left side, a positive crop reduces the time of the side to expand the segment
            segment.start_time -= crop_millisec;
            segment.audio_start_time -= crop_millisec;

        } else {  // right side
            // On the right side, a positive crop increases the time of the side to expand the segment
            segment.end_time += crop_millisec;
            segment.audio_end_time += crop_millisec;
        }
        console.log('segment after crop: ' + segment.start_time + " " + segment.end_time);

        // For the undo action, reverse crop the segment. Don't check for validity.
        undoManager.registerUndoAction(self, self.cropSegment, [segment, -crop_millisec, left_side, false]);

        return true;
	};

	// Scales the audio segment by the specified factor.
	// A factor from 0 to 1 shrinks, and a factor above 1 expands.
	// The anchor point is the left hand side.
	// Other segments to the right will be shifted as a result.
	this.scale_segment = function(segment, scale_factor) {
        // TODO
	};

    // Get the end time of the track in milliseconds, which is the greatest segment end time.
    // Returns 0 if the track is empty
    this.endTime = function() {

        // Iterate over all the segments in the track and get the greatest time
        var timeEnd = 0;
        for (var i = 0; i < audio_segments.length; i++) {
            timeEnd = Math.max(audio_segments[i].end_time, timeEnd);
        };
        return timeEnd;
    };

    // Saving the model to JSON.
    // Returns a JSON string
    this.saveToJSON = function() {
        var json_object = {
            audio_segments: []
        };

        // For each segment, add it to the JSON audio segments
        for (var i = 0; i < audio_segments.length; i++) {
            var json_segment = audio_segments[i].saveToJSON();
            json_object['audio_segments'].push(json_segment);
        };

        return json_object;
    };
};
// Loading the model from JSON
AudioTrack.loadFromJSON = function(json_object) {

    // The JSON object is an array containing the JSON segment objects.
    // Get the segment object from JSON and add it to the array of segments.
    var json_segments = json_object['audio_segments'];
    var audio_segments = [];
    for (var i = 0; i < json_segments.length; i++) {
        var segment = AudioSegment.loadFromJSON(json_segments[i]);
        audio_segments.push(segment);
    };

    // Create a new track and set the segments to the array created above.
    var track = new AudioTrack();
    track.setAudioSegments(audio_segments);

    return track;
};


///////////////////////////////////////////////////////////////////////////////
// Audo Segment
//
// Audio segments contain an audio clip and a location within the track
var AudioSegment = function(audio_resource, audio_length, track_start_time) {
    var self = this;

    // Audio clip data
	var audio_clip = audio_resource;
    var total_audio_length = audio_length;

    // Specifies what part of the audio clip should be played back
	this.audio_start_time = 0;
	this.audio_end_time = audio_length;

    // Location of the segment within the track
	this.start_time = track_start_time;
	this.end_time = track_start_time + audio_length;

    // Get the URL of the audio resource blob needed for playback
    this.audioResource = function() {
        return audio_clip;
    };

    // Get the total length of the audio resource
    this.totalAudioLength = function() {
        return total_audio_length;
    };

    // Get the length of the segment in the track
    this.lengthInTrack = function() {
        return self.end_time - self.start_time;
    };

    // Get the length of the audio that should be played back
    this.audioLength = function() {
        return self.audio_end_time - self.audio_start_time;
    };

    // Returns object {left, right} with two segments that are the result of splitting the segment
    // at the specified track time.
    // Returns null if the track time does not intersect the segment within (start_time, end_time)
    this.splitSegment = function(splitTime) {

        // Check that the track time is valid within (start_time, end_time)
        if (splitTime <= self.start_time || splitTime >= self.end_time) {
            return null;
        };

        // Create a left segment that is the same as the segment except for the end times
        var left_segment = new AudioSegment(audio_clip, total_audio_length, self.start_time);  // start_time is not used (it's set below)
        left_segment.audio_start_time = self.audio_start_time;
        left_segment.audio_end_time = self.trackToAudioTime(splitTime);
        left_segment.start_time = self.start_time;
        left_segment.end_time = splitTime;

        // Create a right segment that is the same as the segment except for the start times
        var right_segment = new AudioSegment(audio_clip, total_audio_length, self.start_time);  // start_time is not used (it's set below)
        right_segment.audio_start_time = self.trackToAudioTime(splitTime);
        right_segment.audio_end_time = self.audio_end_time;
        right_segment.start_time = splitTime;
        right_segment.end_time = self.end_time;

        // Return the two segments
        return { left: left_segment, right: right_segment };
    };

    // Convert a track time to the corresponding time in the audio resource at the current scale.
    // Returns false if the trackTime is invalid.
    this.trackToAudioTime = function(trackTime) {

        // Track time should not be less than 0
        if (trackTime < 0) {
            return false;
        };

        // Convert the track time by using the current start_time as the offset
        var audioTime = self.audio_start_time + (trackTime - self.start_time);

        // Time should not exceed the bounds of the total audio length
        if (audioTime < 0 || audioTime > self.totalAudioLength()) {
            return false;
        };

        return audioTime;
    };

    // Convert a time in the audio resource to the corresponding time in the track at the current scale.
    // Returns false if the audioTime is invalid.
    this.audioToTrackTime = function(audioTime) {

        // Time should not exceed the bounds of the total audio length
        if (audioTime < 0 || audioTime > self.totalAudioLength()) {
            return false;
        };

        // Convert the track time by using the current start_time as the offset
        var trackTime = self.start_time + (audioTime - self.audio_start_time);

        // Track time should not be less than 0
        if (trackTime < 0) {
            return false;
        };

        return trackTime;
    };

    // Saving the model to JSON.
    // Returns a JSON object
    this.saveToJSON = function() {
        var json_object = {
            audio_clip: audio_clip,  // TODO
            total_audio_length: total_audio_length,
            audio_start_time: self.audio_start_time,
            audio_end_time: self.audio_end_time,
            start_time: self.start_time,
            end_time: self.end_time
        };

        return json_object;
    };
};
// Loading the model from JSON
AudioSegment.loadFromJSON = function(json_object) {
    var segment = new AudioSegment(json_object['audio_clip'], json_object['total_audio_length'], 0);
    segment.audio_start_time = json_object['audio_start_time'];
    segment.audio_end_time = json_object['audio_end_time'];
    segment.start_time = json_object['start_time'];
    segment.end_time = json_object['end_time'];

    return segment;
};
