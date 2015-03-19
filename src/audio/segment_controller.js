// Controller for the DOM audio segment inside the DOM audio track
var AudioSegmentController = function(segment, trackController) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var self = this;  // Use self to refer to this in callbacks
    var parentTrackController = null;
    var audioSegment = null;  // audio_segment from the model
    var segmentID = null;  // HTML ID used to identify the segment
    var segmentClass = "audio_segment";
    var wavesurferContainerID = null;  // wavesurfer is drawn in this container in the segment
    var wavesurferContainerClass = "wavesurfer_container";
    var playbackTimeoutID = -1;  // Timeout ID for delayed playback (-1 is null)
    var wavesurfer = null;  // wavesurfer to play audio

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    audioSegment = segment;
    parentTrackController = trackController;

    // Create a new segment ID of the form
    // 'segment#' where '#' is a positive integer
    segmentID = 'segment' + AudioSegmentController.counter;

    // Create a new wavesurfer container ID of the form
    // 'wavesurfer#' where '#' is a positive integer
    wavesurferContainerID = 'wavesurfer' + AudioSegmentController.counter;

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

        // Convert the start and end times from track time to audio time (seconds)
        audioStartTime = audioSegment.trackToAudioTime(trackStartTime) / 1000.0;
        audioEndTime = audioSegment.trackToAudioTime(trackEndTime) / 1000.0;

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
        var jqWaveContainer = jqSegment.children('.'+wavesurferContainerClass);

        // Update the position and size of the segment
        jqSegment.css({'top': 0,
                        'left': pentimento.audioController.millisecondsToPixels(audioSegment.start_time),
                        'width': pentimento.audioController.millisecondsToPixels(audioSegment.lengthInTrack())
                        });

        // Update the position and size of the wavesurfer container.
        // The left is offset so that the audio start will appear at the beginning of the segment
        // The full width should always be displayed.
        var offsetSegmentStartTime = audioSegment.audioToTrackTime(0) - audioSegment.start_time;  // always <= 0
        var offsetSegmentWidth = audioSegment.audioToTrackTime(audioSegment.totalAudioLength()) - audioSegment.audioToTrackTime(0);
        jqWaveContainer.css({'top': 0,
                'left': pentimento.audioController.millisecondsToPixels(offsetSegmentStartTime),
                'width': pentimento.audioController.millisecondsToPixels(offsetSegmentWidth)
                });

        // Update the parameters of wavesurfer
        // TODO!!!
        wavesurfer.load(audioSegment.audioResource());
    };

    // Draw a segment into the jquery parent object
    // Return new jQuery segment
    this.draw = function(jqParent) {

        // Create a new segment div and wavesurfer container div
        var new_segment = $("<div></div>").attr({"id": segmentID, "class": segmentClass});
        var ws_container = $("<div></div>").attr({"id": wavesurferContainerID, "class": wavesurferContainerClass});

        // Add the segment to the parent and add the wavesurfer container div to the segment
        jqParent.append(new_segment);
        new_segment.append(ws_container);

        // add hover method to audio segment divs
        // On mouse over, if object is currently being dragged, then highlight the side to which object will go if dropped
        new_segment.hover( function(event) {
            var this_segment = $(this);

            // Add left or right border highlight on hover
            mouseHover = setInterval(function(){
                if (this_segment.hasClass("obstacle")) {
                    // Check to see if it over laps with segment on the left half
                    if ( mouseX >= this_segment.offset().left &&
                         mouseX <= this_segment.offset().left + this_segment.width()/2 ) {
                        // Highlight left edge
                        $('#right_target_div').remove();
                        if($('#left_target_div').length == 0) {
                            var target_div = $("<div>", {id: "left_target_div"}).
                            offset({ top: this_segment.offset().top, left: this_segment.offset().left});
                            target_div.height(this_segment.height());
                            $('#'+timelineID).append(target_div);
                        }
                    }
                    // Check to see if it over laps with segment on the right half
                    else if ( mouseX > this_segment.offset().left + this_segment.width()/2 && 
                              mouseX <= this_segment.offset().left + this_segment.width() ) {
                        // Highlight right edge
                        $('#left_target_div').remove();
                        if($('#right_target_div').length == 0) {
                            var target_div = $("<div>", {id: "right_target_div"})
                            .offset({ top: this_segment.offset().top, left: this_segment.offset().left + this_segment.width() });
                            target_div.height(this_segment.height());
                            $('#'+timelineID).append(target_div);
                        }
                    };
                }
            }, 100);
        }, function() {
            var this_segment = $(this);
            clearInterval(mouseHover);
            $('#left_target_div').remove();
            $('#right_target_div').remove();
        });

        // Setup the dragging and resizing on audio segment
        new_segment.draggable({
            preventCollision: true,
            containment: 'parent',
            obstacle: ".obstacle",
            axis: "x",
            opacity: 0.65,
            drag: function( event, ui ) {
                // Dragging relies on information in the entire track, so it is relayed to the parent track
                parentTrackController.segmentDrag(event, ui, self);
            }
        }).resizable({
            handles: "e, w",
            minWidth: 1,
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
            waveColor: 'violet',
            progressColor: 'purple',
            height: parseInt(new_segment.css('height')),
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


