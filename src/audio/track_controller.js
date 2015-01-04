// Controller for the DOM audio track inside the DOM track container
var AudioTrackController = function(track) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var audioTrack = null;  // audio_track from the model
    var segmentControllers = [];  // Controllers for each of the segments in the track
    var isPlayingBack = false;  // Indicates playback status
    var trackID = null;  // HTML ID used to identify the track
    var trackClass = "audio_track";

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    audioTrack = track;

    // Create a new track ID of the form
    // 'track#' where '#' is a positive integer 
    trackID = 'track' + (AudioTrackController.counter++);


    ///////////////////////////////////////////////////////////////////////////////
    // Callback methods
    ///////////////////////////////////////////////////////////////////////////////

    var segmentDragging = function() {

    };

    var segmentStopDragging = function() {

    };

    ///////////////////////////////////////////////////////////////////////////////
    // Getter Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Get the ID of the track
    this.getID = function() {
        return trackID;
    };

    // Get the length of the track in milliseconds
    this.getLength = function() {
        return audioTrack.endTimeLecture();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Insert a new segment controller with the provided segment and return the new controller
    this.insertSegmentController = function(newSegment) {
        // Insert the segment into the model and keep track of the segments
        // that might have been created from the split.
        var newSplitSegments = audioTrack.insertSegment(newSegment);
        var newController = new AudioSegmentController(newSegment);
        // TODO: handle the new split segments
        segmentControllers.push(newController);
        return newController;
    };

    // Remove a track controller and its track
    this.removeSegmentController = function(segmentController) {
        // If the current controller is the recording controller,
        // set another controller to be recording.
    };

    // Start the playback of the track at the specified time interval
    // Stops the previous playback if there is on currently going.
    // The time is specified in milliseconds. If the end time is not specified,
    // playback goes until the end of the track.
    this.startPlayback = function(startTime, endTime) {

        if (isPlayingBack) {
            this.stopPlayback();
        }
        isPlayingBack = true;

        // TODO: stop at the end time if specified

        // Play all of the segment controllers that are after the cursor.
        for (var i = 0; i < segmentControllers.length; i++) {
            var segmentController = segmentControllers[i];
            var segment = segmentController.getAudioSegment();

            // Get the delay in milliseconds from now until when the playback will occur
            // Compute the start time of the audio (sometimes starts play in middle of segment)
            var playbackDelay;
            var audioStartTime;

            // If the segment starts after the current start time
            if (segment.lecture_start_time >= startTime) {
                playbackDelay = segment.lecture_start_time - startTime;
                audioStartTime = segment.audio_start_time;
            }
            // If the start time is in the middle of the segment 
            else if (segment.lecture_end_time > startTime) {
                playbackDelay = 0;
                audioStartTime = segment.audio_start_time + (startTime-segment.lecture_start_time);
            }
            // If the start time is after the entire segment
            else {
                // Don't even play this segment
                continue;
            };

            // Set the playback on the segment controller with the specified delay
            segmentController.startPlayback(playbackDelay, audioStartTime);
        };
    };

    // Stop the playback of the track. Does nothing if the track is not playing.
    this.stopPlayback = function() {

        // Stop all of the audio segment controllers
        for (var i = 0; i < segmentControllers.length; i++) {
            segmentControllers[i].stopPlayback();
        };
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Drawing methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Draw a track into the parent jquery container
    // Return the new jQuery track
    this.draw = function(jqParent) {

        // Create a new jquery track div
        var new_track = $('<div></div>').attr({"id": trackID , "class": trackClass});
        new_track.sortable();

        // Add the track to the parent
        jqParent.append(new_track);

        // Iterate over all segments controllersfor that track and draw the segments.
        // Add the draw segments to the track container.
        for (var i = 0; i < segmentControllers.length; i++) {
            console.log("Drawing segment  " + i);
            var jqSegment = segmentControllers[i].draw(new_track);
            new_track.append(jqSegment);
        };

        return new_track;
    };

};

///////////////////////////////////////////////////////////////////////////////
// Static Variables
///////////////////////////////////////////////////////////////////////////////

// Counter used for the ID
AudioTrackController.counter = 0;


