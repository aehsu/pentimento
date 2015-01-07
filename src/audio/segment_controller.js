// Controller for the DOM audio segment inside the DOM audio track
var AudioSegmentController = function(segment) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var audioSegment = null;  // audio_segment from the model
    var segmentID = null;  // HTML ID used to identify the segment
    var segmentClass = "audio_segment";
    var playbackTimeoutID = -1;  // Timeout ID for delayed playback (-1 is null)
    var wavesurfer = null;  // wavesurfer to play audio

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    // Audio model segment is passed on input
    audioSegment = segment;

    // Create a new segment ID of the form
    // 'segment#' where '#' is a positive integer
    segmentID = 'segment' + (AudioSegmentController.counter++);

    ///////////////////////////////////////////////////////////////////////////////
    // Getter methods
    ///////////////////////////////////////////////////////////////////////////////

    // Get the ID of the segment
    this.getID = function() {
        return segmentID;
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
    this.startPlayback = function(delay, startTime, endTime) {

        // Stop any ongoing playback
        this.stopPlayback();

        // If the end time is undefined, set it to the end
        if (typeof endTime === 'undefined') {
            endTime = audioSegment.audio_end_time;
        };

        // Generate a function used for playback to be registered with a timer.
        // Times are in milliseconds
        var playbackSegment = function() {
            var result = function() {
                // Play the wavesurfer over the specified range
                wavesurfer.play(startTime, endTime);
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

        var jqSegment = $('#'+this.getID());

        // Update the position and size of the segments
        jqSegment.css({'top': 0,
                        'left': pentimento.audioController.millisecondsToPixels(audioSegment.start_time),
                        'width': pentimento.audioController.millisecondsToPixels(audioSegment.getLength()) 
                        });

        // Update the parameters of wavesurfer
        // TODO!!!
    };

    // Draw a segment into the jquery parent object
    // Return new jQuery segment
    this.draw = function(jqParent) {

        // Create a new segment div 
        var new_segment = $("<div></div>").attr({"id": segmentID, "class": segmentClass});
        // new_segment.data(audioSegment);

        // Add the segment to the parent
        jqParent.append(new_segment);

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

        // Setup the dragging on audio segment
        new_segment.draggable({
            preventCollision: true,
            containment: 'parent',
            obstacle: ".obstacle",
            axis: "x",
            opacity: 0.65
        }).on( "dragstart", function( event, ui ) {
            // When you drag an object, all others become obstacles for dragging
            $('.'+segmentClass).each(function(index, segment) {
                // Don't check itself
                if (segment !== ui.helper[0]) {
                    $(segment).addClass('obstacle');
                };
            });

            ui.helper.addClass('dragged')
        }).on( "dragstop", function( event, ui ) { // check to see if segment was dragged to an end of another segment
            
            // Call shift function in model
            // audio_segment.shift_segment(ui.position.left - ui.originalPosition.left)
            // figure out if segment needs to be moved (if dropped on top of something)
            pentimento.audio_track.place_segment(ui.helper.attr('id').substring(8), event);

            // When you finish dragging an object, remove the obstacles classes
            $('.'+segmentClass).each(function(index, segment) {
                // Don't check itself
                if (segment !== ui.helper[0]) {
                    $(segment).removeClass('obstacle');
                };
            });
            ui.helper.removeClass('dragged')
        }).resizable({
            handles: "e, w",
            minWidth: 1,
            stop: function( event, ui ) {
                dwidth = ui.originalSize.width - ui.size.width;
                if (ui.position.left === ui.originalPosition.left) { // then right handle was used
                    // Trim audio from Right
                    audioSegment.crop_segment(dwidth, "right");
                }
                else {
                    // Trim audio from Left
                    audioSegment.crop_segment(dwidth, "left");
                }
            }
        });

        // Load the waveform to be displayed inside the segment div
        // Initialize wavesurfer for the segment
        wavesurfer = Object.create(WaveSurfer);
        wavesurfer.init({
            container: document.querySelector('#'+segmentID),
            waveColor: 'violet',
            progressColor: 'purple',
            height: parseInt(new_segment.css('height')),
            minPxPerSec: 1
        });
        wavesurfer.load(audioSegment.audio_resource);

        // Return the new segment
        return new_segment;
    };

};

///////////////////////////////////////////////////////////////////////////////
// Static Variables
///////////////////////////////////////////////////////////////////////////////

// Counter used for the ID
AudioSegmentController.counter = 0;


