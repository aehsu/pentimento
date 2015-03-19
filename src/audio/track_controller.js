// Controller for the DOM audio track inside the DOM track container
var AudioTrackController = function(track, audioController) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var self = this;  // Use self to refer to this in callbacks
    var parentAudioController = null;
    var audioTrack = null;  // audio_track from the model
    var segmentControllers = [];  // Controllers for each of the segments in the track
    var isPlayingBack = false;  // Indicates playback status
    var trackID = null;  // HTML ID used to identify the track
    var trackClass = "audio_track";
    var cropSide = null;  // 'w' for left sied, 'e' for right side. Set at the beginning of each crop

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    audioTrack = track;
    parentAudioController = audioController;

    // Create a new track ID of the form
    // 'track#' where '#' is a positive integer 
    trackID = 'track' + (AudioTrackController.counter++);


    ///////////////////////////////////////////////////////////////////////////////
    // Getter Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Get the ID of the track
    this.getID = function() {
        return trackID;
    };

    // Get the length of the track in milliseconds
    this.getLength = function() {
        return audioTrack.endTime();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Callback methods
    ///////////////////////////////////////////////////////////////////////////////

    this.segmentDrag = function(event, ui, segmentController) {
        // If the drag is overlaps another segment, then set the position back to the original position
        // ui.position.left = Math.min( 100, ui.position.left );
        var audioSegment = segmentController.getAudioSegment();
        var shiftMilli = parentAudioController.pixelsToMilliseconds(ui.position.left) - audioSegment.start_time;
        var shiftResult = audioTrack.shiftSegment(audioSegment, shiftMilli);
        console.log(shiftResult);

        // Prevent the direct dragging that jQuery UI does if the shift is not valid
        if (shiftResult !== true) {
            ui.position.left = ui.originalPosition.left;
        };
    };

    // Callback for when the segment UI div starts to be cropped.
    // Sets the internal variable for left or right side cropping.
    this.segmentCropStart = function(event, ui, segmentController) {

        // Figure out whether the left or right side is being cropped by looking at the class of the element
        cropSide = event.toElement.classList.contains("ui-resizable-w") ? 'w' : 'e';
    };

    // Callback for when the segment UI div is being cropped.
    // If the cropping is valid, it does nothing.
    // If the cropping is invalid, it sets the UI div back to the original size and position.
    this.segmentCropping = function(event, ui, segmentController) {
        var audioSegment = segmentController.getAudioSegment();

        // Figure out whether the left or right side is being cropped
        var leftSide = (cropSide === 'w');
        console.log(leftSide);

        // Crop amount should be positive if expanding, and negative if contracting
        var cropMilli = parentAudioController.pixelsToMilliseconds(ui.size.width - ui.originalSize.width);
        var cropResult = audioTrack.canCropSegment(audioSegment, cropMilli, leftSide);

        // If the crop was valid, set the cropResult to the original value because it needs to be added to the length
        // for adjusting the UI
        if (cropResult === true) {
            cropResult = cropMilli;
        };

        // If the crop result is not valid number, then it is an error
        if(typeof cropResult !== "number") {
            console.error("Crop error (" + (typeof cropResult) + "): " + cropResult);
        };

        // Update the position according to the model
        // Account for the shift and change in size due to the possible crop.
        var leftShift = leftSide ? -cropResult : 0;
        ui.position.left = parentAudioController.millisecondsToPixels(audioSegment.start_time + leftShift);
        ui.size.width = parentAudioController.millisecondsToPixels(audioSegment.lengthInTrack() + cropResult);
    };

    // Callback for when the segment UI div has finished being cropped.
    // The cropping should always be valid because the 'segmentCropping' callback
    // only allows cropping to happen in valid ranges.
    this.segmentCropFinish = function(event, ui, segmentController) {
        var audioSegment = segmentController.getAudioSegment();

        // Figure out whether the left or right side is being cropped
        var leftSide = (cropSide === 'w');

        // Crop amount should be positive if expanding, and negative if contracting
        var cropMilli = parentAudioController.pixelsToMilliseconds(ui.size.width - ui.originalSize.width);

        // Crop should be tested first
        var cropResult = audioTrack.canCropSegment(audioSegment, cropMilli, leftSide);

        // If the crop was valid, set the cropResult to the original value to be used in the actual cropping
        if (cropResult === true) {
            cropResult = cropMilli;
        };

        // If the crop result is not valid, then it is an error
        if(typeof cropResult !== "number") {
            console.error("Crop error (" + (typeof cropResult) + "): " + cropResult);
        };

        // Perform the actual crop
        cropResult = audioTrack.cropSegment(audioSegment, cropResult, leftSide);

        // If the crop result is not valid, then it is an error
        if (cropResult !== true) {
            console.error("Crop error (" + (typeof cropResult) + "): " + cropResult);
        };

        // Recalculate the size and position based on the new segment size
        ui.position.left = parentAudioController.millisecondsToPixels(audioSegment.start_time);
        ui.size.width = parentAudioController.millisecondsToPixels(audioSegment.lengthInTrack());

        // Refresh the view to accurately display the latest positions
        this.refreshView();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Insert a new segment controller with the provided segment and return the new controller
    this.insertSegmentController = function(newSegment) {
        // Insert the segment into the model and keep track of the segments
        // that might have been created from the split.
        var newSplitSegments = audioTrack.insertSegment(newSegment);
        var newController = new AudioSegmentController(newSegment, self);
        newController.track
        // TODO: handle the new split segments
        segmentControllers.push(newController);
        // Draw the new controller
        newController.draw($('#'+trackID));
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
            if (segment.start_time >= startTime) {
                playbackDelay = segment.start_time - startTime;
                audioStartTime = segment.audio_start_time;
            }
            // If the start time is in the middle of the segment 
            else if (segment.end_time > startTime) {
                playbackDelay = 0;
                audioStartTime = segment.audio_start_time + (startTime-segment.start_time);
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

    // Refresh the view to reflect the state of the model (audioTrack)
    this.refreshView = function() {

        // Refresh each of the segments
        for (var i = 0; i < segmentControllers.length; i++) {
            segmentControllers[i].refreshView();
        };
    };

    // Draw a track into the parent jquery container
    // Return the new jQuery track
    this.draw = function(jqParent) {

        // Create a new jquery track div
        var new_track = $('<div></div>').attr({"id": trackID , "class": trackClass});

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


