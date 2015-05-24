///////////////////////////////////////////////////////////////////////////////
// Audio Segment Controller
//
// Controller for the DOM audio segment inside the DOM audio track
// Translates user input into actions that modify the audio segment
// Some of these actions are relayed back to the track controller, 
// as the modification will affect the entire track.
// Responsible for drawing the audio segment and displaying updates.
// Controls segment playback.
"use strict";
var AudioSegmentController = function(segment, trackController) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var self = this;  // Use self to refer to this in callbacks
    var audioController = null;
    var parentTrackController = null;
    var audioSegment = null;  // audio_segment from the model
    var segmentID = null;  // HTML ID used to identify the segment
    var segmentClass = "audio_segment";
    var handleID = null;  // Handle used for dragging the segment
    var handleClass = "segment_handle";
    var wavesurferContainerID = null;  // wavesurfer is drawn in this container in the segment
    var wavesurferContainerClass = "wavesurfer_container";
    var focusClass = "focus";
    var playbackTimeoutID = -1;  // Timeout ID for delayed playback (-1 is null)
    var wavesurfer = null;  // wavesurfer to play audio

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    audioSegment = segment;
    parentTrackController = trackController;
    audioController = trackController.getParentAudioController();

    // Create a new segment ID of the form
    // 'segment#' where '#' is a positive integer
    segmentID = 'segment' + AudioSegmentController.counter;

    // Create a new hangle ID of the form
    // 'handle#' where '#' is a positive integer
    handleID = 'handle' + AudioSegmentController.counter;

    // Create a new wavesurfer container ID of the form
    // 'wavesurfer#' where '#' is a positive integer
    wavesurferContainerID = 'wavesurfer' + AudioSegmentController.counter;

    // Increment the counter for when the next segment is created
    AudioSegmentController.counter++;

    ///////////////////////////////////////////////////////////////////////////////
    // Getter methods
    ///////////////////////////////////////////////////////////////////////////////

    // Get the ID of the segment
    this.getID = function() {
        return segmentID;
    };

    // Get the ID of the wavesurfer container
    this.getWavesurferContainerID = function() {
        return wavesurferContainerID;
    };

    // Get the name of the class used to represent audio segments
    this.getClassName = function() {
        return segmentClass;
    };

    // Get the segment
    this.getAudioSegment = function() {
        return audioSegment;
    };

    // Get the parent track controller
    this.getParentTrackController = function() {
        return parentTrackController;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    ///////////////////////////////////////////////////////////////////////////////

    // Playback the audio segment after a delay at the specied time interval (milliseconds).
    // If the end time is undefined, play until the end.
    // If playback is currently going or scheduled, then cancel the current and start a new one.
    this.startPlayback = function(delay, trackStartTime, trackEndTime) {

        // Stop any ongoing playback
        this.stopPlayback();

        // If the end time is undefined, set it to the end of the segment
        if (typeof trackEndTime === 'undefined') {
            trackEndTime = audioSegment.end_time;
        };

        // Convert the start and end times from track time to audio time (seconds for wavesurfer)
        var audioStartTime = audioSegment.trackToAudioTime(trackStartTime) / 1000.0;
        var audioEndTime = audioSegment.trackToAudioTime(trackEndTime) / 1000.0;

        // Generate a function used for playback to be registered with a timer.
        // Times are in milliseconds
        var playbackSegment = function() {
            var result = function() {
                // Play the wavesurfer over the specified range
                wavesurfer.play(audioStartTime, audioEndTime);
            };
            return result;
        }();

        // Register a timer and save the timeout ID so it can be cancelled
        playbackTimeoutID = setTimeout(playbackSegment, delay);
    };

    // Stop any ongoing or scheduled playback.
    this.stopPlayback = function() {

        // Stop the wavesurfer playing if it is playing and the current time is not 0.
        if (wavesurfer.getCurrentTime() > 0) {
            wavesurfer.stop();
        };

        // Reset the wavesurfer progress indicator to the beginning
        wavesurfer.seekTo(0);

        // Stop the pending playback if there is one
        if (playbackTimeoutID != -1) {
            clearTimeout(playbackTimeoutID);
        };
        playbackTimeoutID = -1;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Drawing Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Refresh the view to reflect the state of the model (audioSegment)
    this.refreshView = function() {

        var jqSegment = $('#'+self.getID());
        var jqHandle = $('#'+handleID);
        var jqWaveContainer = jqSegment.children('.'+wavesurferContainerClass);

        // Update the position and size of the segment
        jqSegment.css({'top': 0,
                        'left': audioController.millisecondsToPixels(audioSegment.start_time),
                        'width': audioController.millisecondsToPixels(audioSegment.lengthInTrack())
                        });

        // The position of the handle is always fixed to the top left through CSS, and doesn't require updating.

        // Update the position and size of the wavesurfer container.
        // The left is offset so that the audio start will appear at the beginning of the segment
        // The full width should always be displayed.
        // The wavesurfer displays below the handle (offset the top)
        var offsetSegmentStartTime = audioSegment.audioToTrackTime(0) - audioSegment.start_time;  // always <= 0
        var offsetSegmentWidth = audioSegment.audioToTrackTime(audioSegment.totalAudioLength()) - audioSegment.audioToTrackTime(0);
        jqWaveContainer.css({'top': jqHandle.css('height'),
                'left': audioController.millisecondsToPixels(offsetSegmentStartTime),
                'width': audioController.millisecondsToPixels(offsetSegmentWidth), 
                'height': jqWaveContainer.css('height')
                });

        // Update the wavesurfer by reloading the existing audio resource
        wavesurfer.load(audioSegment.audioResource());
    };

    // Draw a segment into the jquery parent object
    // Return new jQuery segment
    this.draw = function(jqParent) {

        // Create a new segment div, handle div, and wavesurfer container div
        var new_segment = $("<div></div>").attr({"id": segmentID, "class": segmentClass});
        var new_handle = $("<div></div>").attr({"id": handleID, "class": handleClass});
        var ws_container = $("<div></div>").attr({"id": wavesurferContainerID, "class": wavesurferContainerClass});

        // Add the segment to the parent and add the handle and wavesurfer container div to the segment
        jqParent.append(new_segment);
        new_segment.append(new_handle);
        new_segment.append(ws_container);

        // Add the click method to give focus on segments
        new_segment.click(function() {
            // Remove focus on all segments
            $("."+segmentClass).removeClass(focusClass);
            new_segment.addClass(focusClass);
        });

        // Setup the dragging and resizing on audio segment
        new_segment.draggable({
            containment: 'parent',
            snap: "."+segmentClass,
            snapMode: "outer",
            snapTolerance: 0,
            axis: "x",
            opacity: 0.65,
            handle: '#'+handleID,
            start: function( event, ui) {
                parentTrackController.segmentDragStart(event, ui, self);
            },
            drag: function( event, ui ) {
                // Dragging relies on information in the entire track, so it is relayed to the parent track
                parentTrackController.segmentDragging(event, ui, self);
            },
            stop: function( event, ui) {
                parentTrackController.segmentDragFinish(event, ui, self);
            }
        }).resizable({
            containment: 'parent',
            handles: "e, w",
            distance: 0,
            minWidth: 10,
            start: function( event, ui) {
                parentTrackController.segmentCropStart(event, ui, self);
            },
            resize: function( event, ui ) {
                parentTrackController.segmentCropping(event, ui, self);
            }, 
            stop: function( event, ui ) {
                parentTrackController.segmentCropFinish(event, ui, self);
            }
        });

        // Load the waveform to be displayed inside the segment div
        // Initialize wavesurfer for the segment
        wavesurfer = Object.create(WaveSurfer);
        wavesurfer.init({
            container: ws_container[0],
            waveColor: '#848484',
            progressColor: 'purple',
            height: parseInt(ws_container.css('height')),
            minPxPerSec: 1
        });

        // The audio segment is also loaded upon refresh
        wavesurfer.load(audioSegment.audioResource());

        // Return the new segment
        return new_segment;
    };

    // Shift the internal wavesurfer container left (negative) or right (positive) in pixels.
    // This is used when cropping to move the container so the cropping motion looks natural.
    this.shiftWavesurferContainer = function(pixelShift) {
        var jqSegment = $('#'+self.getID());
        var jqWaveContainer = jqSegment.children('.'+wavesurferContainerClass);

        jqWaveContainer.css({ left: jqWaveContainer.position().left + pixelShift });
    };

};

///////////////////////////////////////////////////////////////////////////////
// Static Variables
///////////////////////////////////////////////////////////////////////////////

// Counter used for the ID
AudioSegmentController.counter = 0;


