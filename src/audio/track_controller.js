///////////////////////////////////////////////////////////////////////////////
// Audio Track Controller
//
// Controller for the DOM audio track inside the DOM track container
// Handles the user input passed on from the segments into and modifies the audio track
// Responsible for drawing the audio track and displaying updates.
// Controls playback through segment playback.
"use strict";
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
    var focusClass = "focus";  // Class added to elements with focus
    var lastValidPositionLeft = -1;  // Used to keep track of the last valid segment position when dragging or cropping.
    var lastValidWidth = -1;  // Used to keep track of the last valid segment width when cropping.
    var cropLeftSide = null;  // true if the left side is being cropped. Set at the beginning of each crop

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

    // Get the audio track
    this.getAudioTrack = function() {
        return audioTrack;
    };

    // Get the parent audio controller
    this.getParentAudioController = function() {
        return parentAudioController;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Callback methods
    ///////////////////////////////////////////////////////////////////////////////

    // Callback for when the segment UI div starts to be dragged.
    // Sets initial internal variables.
    this.segmentDragStart = function(event, ui, segmentController) {
        // Sets the internal variable for the last valid position.
        lastValidPositionLeft = ui.originalPosition.left;
    };

    // Callback for when the segment UI div is being dragged.
    // Tests whether or not the drag is valid.
    // If the dragging is valid, it does nothing, allowing the segment UI div to be dragged to the new position.
    // If the dragging is invalid, it sets the segment UI div back to the last valid position.
    this.segmentDragging = function(event, ui, segmentController) {
        // We assume that the shift will be valid because of the snapping feature of jQuery draggable
        // Shift the segment by the amount dragged
        var audioSegment = segmentController.getAudioSegment();
        var shiftMilli = parentAudioController.pixelsToMilliseconds(ui.position.left) - audioSegment.start_time;
        var shiftResult = audioTrack.canShiftSegment(audioSegment, shiftMilli);

        // If the shift is valid, then update the last valid position
        if (shiftResult === true) {
            lastValidPositionLeft = ui.position.left;
        }
        // Else reset the segment UI div to the last valid position
        else {
            ui.position.left = lastValidPositionLeft;
        };
    };

    // Callback for when the segment UI div has finished being dragged.
    // Actually performs the drag on the model.
    this.segmentDragFinish = function(event, ui, segmentController) {
        var audioSegment = segmentController.getAudioSegment();
        var shiftMilli = parentAudioController.pixelsToMilliseconds(ui.position.left) - audioSegment.start_time;

        // Perform the shift
        var shiftResult = audioTrack.shiftSegment(audioSegment, shiftMilli);

        // If the shift does not succeed, then there is a problem
        if (shiftResult !== true) {
            console.error("Shift error (" + (typeof shiftResult) + "): " + shiftResult);
        };

        // Reset the value of the last valid position
        lastValidPositionLeft = -1;
    };

    // Callback for when the segment UI div starts to be cropped.
    // Sets the initial internal variables.
    this.segmentCropStart = function(event, ui, segmentController) {

        // Figure out whether the left or right side is being cropped by looking at the class of the element
        cropLeftSide = event.toElement.classList.contains("ui-resizable-w");

        // Keep track of the last valid position and size
        lastValidPositionLeft = ui.originalPosition.left;
        lastValidWidth = ui.originalSize.width;
    };

    // Callback for when the segment UI div is being cropped.
    // If the cropping is valid, it does nothing.
    // If the cropping is invalid, it sets the UI div back to the original size and position.
    this.segmentCropping = function(event, ui, segmentController) {
        var audioSegment = segmentController.getAudioSegment();

        // Crop amount should be positive if expanding, and negative if contracting
        var cropMilli = parentAudioController.pixelsToMilliseconds(ui.size.width - ui.originalSize.width);
        var cropResult = audioTrack.canCropSegment(audioSegment, cropMilli, cropLeftSide);
        console.log("cropMilli: " + cropMilli);
        console.log("cropResult: " + cropResult);

        // If the crop was valid, then update the last valid position and size.
        // Also update the wavesurfer container view to appear consistent with the crop
        if (cropResult === true) {

            // Shift the wavesurfer container so that the wavesurfer is not moving along with the crop.
            segmentController.shiftWavesurferContainer(lastValidPositionLeft - ui.position.left);

            // Update the last valid position and size to the current UI parameters
            lastValidPositionLeft = ui.position.left;
            lastValidWidth = ui.size.width;
                    // // Recalculate the size and position based on the new segment size
        // ui.position.left = parentAudioController.millisecondsToPixels(audioSegment.start_time);
        // ui.size.width = parentAudioController.millisecondsToPixels(audioSegment.lengthInTrack());
        }
        // Else, reset the position and size to the last valid parameters
        else {
            ui.position.left = lastValidPositionLeft;
            ui.size.width = lastValidWidth;
        };

    };

    // Callback for when the segment UI div has finished being cropped.
    // The cropping should always be valid because the 'segmentCropping' callback
    // only allows cropping to happen in valid ranges.
    this.segmentCropFinish = function(event, ui, segmentController) {
        var audioSegment = segmentController.getAudioSegment();

        // Crop amount should be positive if expanding, and negative if contracting
        var cropMilli = parentAudioController.pixelsToMilliseconds(ui.size.width - ui.originalSize.width);

        // Perform the actual crop
        cropResult = audioTrack.cropSegment(audioSegment, cropMilli, cropLeftSide);

        // If the crop result is not valid, then it is an error
        if (cropResult !== true) {
            console.error("Crop error (" + (typeof cropResult) + "): " + cropResult);
        };

        // Update the view so that it is consistent with the actual crop.
        // This is necessary due to strange behavior with jQuery resizeable.
        this.refreshView();

        // Reset the value of the last valid position, size, and crop side
        lastValidPositionLeft = -1;
        lastValidWidth = -1;
        cropLeftSide = null;
    };

    // Remove all segments that have focus
    this.removeFocusedSegments = function() {
        // Find the segments that have focus, and removes them from the model
        // and also deletes their controllers
        for (var i = 0; i < segmentControllers.length; i++) {
            // Focused segments have the segmentFocusClass
            if ( $('#'+segmentControllers[i].getID()).hasClass(focusClass) ) {
                this.removeSegment(segmentControllers[i].getAudioSegment());
            };
        };
        // Refresh the view to load any changes
        // TODO: maybe not necessary
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Insert a new segment into the track
    this.insertSegment = function(newSegment) {
        // Insert the segment into the model and keep track of the segments
        // that might have been created from the split.
        var newSplitSegments = audioTrack.insertSegment(newSegment);
        var newController = new AudioSegmentController(newSegment, self);
        segmentControllers.push(newController);
        // Draw the new controller
        newController.draw($('#'+trackID));
    };

    // Remove a segment from the track. Also removes its segment controller.
    this.removeSegment = function(segment) {
        // Removes the segment from the model
        audioTrack.removeSegment(segment);

        // Removes the segment controller from the track controller
        // Find the index of the segment controller to be removed.
        for (var i = 0; i < segmentControllers.length; i++) {
            if (segmentControllers[i].getAudioSegment() === segment) {
                // Remove the element from the DOM
                $('#'+segmentControllers[i].getID()).remove();

                // Remove the segment controller from the segment controllers array
                segmentControllers.splice(i, 1);

                break;
            };
        };
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
            var trackStartTime;

            // If the segment starts after the current start time
            if (segment.start_time >= startTime) {
                playbackDelay = segment.start_time - startTime;
                trackStartTime = segment.start_time;
            }
            // If the start time is in the middle of the segment 
            else if (segment.end_time > startTime) {
                playbackDelay = 0;
                trackStartTime = startTime-segment.start_time;
            }
            // If the start time is after the entire segment
            else {
                // Don't even play this segment
                continue;
            };

            // Set the playback on the segment controller with the specified delay
            segmentController.startPlayback(playbackDelay, trackStartTime);
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


