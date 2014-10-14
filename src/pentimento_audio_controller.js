function AudioController() {

    ////////////////////////
    // Member vars
    ////////////////////////

    // set global mouse position in relation to page
    var mouseX = null;
    var mouseY = null;

	// self can be used to refer to the object in different scopes (such as listeners)
	var self = this;

	// Array of pentimento.audio_track
	var audio_tracks = [];

	// RecordRTC is used to record the audio stream
	var recordRTC = null;

    // Wavesurfer is used to display audio waveforms
    // There is one wavesurfer object for each segment, so we use a 2D array to hold the wavesurfer objects
    // The outer array is for tracks, and the inner array is for segments
    var wavesurfers = [[]];

    // begin_record_time is the global lecture time when the recording was started
    // The time is in milliseconds UTC
    // -1 indicates that there is no recording in progress
    var begin_record_time = -1;

    // The current location of the lecture in milliseconds
    var lectureTime = 0;

    // The scale of the timeline in pixels per second
    var timeline_pixels_per_sec = 10;


    ///////////////////////////////////////////////////////////////////////////////
    // DOM object IDs and classes
    ///////////////////////////////////////////////////////////////////////////////

    var timelineID = 'audio_timeline';
    var timelineCursorID = 'audio_timeline_cursor'
    var gradationContainerID = 'gradation_container';

    // Track
    var trackClass = "audio_track";
    var trackID = function(trackIndex) {
        return "track-" + trackIndex;
    };

    // Segment
    var segmentClass = "audio_segment";
    var segmentID = function(segmentIndex) {
        return "segment-" + segmentIndex;
    };



    ///////////////////////////////////////////////////////////////////////////////
    // Private methods
    ///////////////////////////////////////////////////////////////////////////////

    // Convert milliseconds to pixels according to the current scale
    var millisecondsToPixels = function(millSec) {
        return Math.round((millSec/1000.0) * timeline_pixels_per_sec);
    }

    // Convert pixels to milliseconds according to the current scale
    var pixelsToMilliseconds = function(pixels) {
        return 1000*(pixels/timeline_pixels_per_sec);
    }

    // Draw a segment into the track
    // Return new jQuery segment
    var drawSegment = function(trackIndex, segmentIndex) {

        // TODO: don't draw if one already exists

        var audio_track = audio_tracks[trackIndex];
        var audio_segment = audio_track.audio_segments[segmentIndex];

        // Create a new segment div 
        var new_segment = $("<div></div>").attr({"id": segmentID(segmentIndex), "class": segmentClass});
        new_segment.data(audio_segment);
        $('#'+trackID(trackIndex)).append(new_segment);

        // Set the css for the new segment
        console.log(millisecondsToPixels(audio_segment.lectureLength()));
        new_segment.css({ "padding": 0, 
                        "width": millisecondsToPixels(audio_segment.lectureLength()), 
                        "height": $('#'+timelineID).height()/2 });
        console.log(new_segment.css("width"));


        // add hover method to audio segment divs
        // On mouse over, if object is currently being dragged, then highlight the side to which object will go if dropped
        new_segment.hover( function(event) {
            var this_segment = $(this);

            // Add left or right border highlight on hover
            mouseHover = setInterval(function(){
                if (this_segment.hasClass("obstacle")) {
                    // Check to see if it over laps with segment on the left half
                    if ( mouseX >= this_segment.offset().left && mouseX <= this_segment.offset().left + this_segment.width()/2 ) {
                        // Highlight left edge
                        $('#right_target_div').remove();
                        if($('#left_target_div').length == 0) {
                            var target_div = $("<div>", {id: "left_target_div"}).offset({ top: this_segment.offset().top, left: this_segment.offset().left});
                            target_div.height(this_segment.height());
                            $('#'+timelineID).append(target_div);
                        }
                    }
                    // Check to see if it over laps with segment on the right half
                    else if ( mouseX > this_segment.offset().left + this_segment.width()/2 && mouseX <= this_segment.offset().left + this_segment.width() ) {
                        // Highlight right edge
                        $('#left_target_div').remove();
                        if($('#right_target_div').length == 0) {
                            var target_div = $("<div>", {id: "right_target_div"}).offset({ top: this_segment.offset().top, left: this_segment.offset().left + this_segment.width() });
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
            containment: '#'+timelineID,
            obstacle: ".obstacle",
            // containment: ("#" + new_track_id),
            axis: "x",
            opacity: 0.65
        }).on( "dragstart", function( event, ui ) {
            // Remove cursor object
            $('#'+timelineCursorID).hide(100);
            // When you drag an object, all others become obstacles for dragging
            $('.'+segmentClass).each(function(index, segment) {
                // Don't check itself
                if (segment !== ui.helper[0]) {
                    $(segment).addClass('obstacle');
                };
            });

            ui.helper.addClass('dragged')
        }).on( "dragstop", function( event, ui ) { // check to see if segment was dragged to an end of another segment
            
            $('#'+timelineCursorID).show(50);

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
                if (ui.position.left === ui.originalPosition.left) // then right handle was used
                    // Trim audio from Right
                    audio_segment.crop_segment(dwidth, "right");
                else
                    // Trim audio from Left
                    audio_segment.crop_segment(dwidth, "left");
            }
        });

        // Load the waveform to be displayed inside the segment div
        // Initialize wavesurfer for the segment
        var wavesurfer = Object.create(WaveSurfer);
        wavesurfers[trackIndex][segmentIndex] = wavesurfer;
        wavesurfer.init({
            container: document.querySelector("#"+segmentID(segmentIndex)),
            waveColor: 'violet',
            progressColor: 'purple',
            height: $('#'+timelineID).height()/2 + "px"
        });
        wavesurfer.on('ready', function () {
            wavesurfer.play();
        });
        wavesurfer.load(audio_segment.audio_resource);

        // Return the new segment
        return new_segment;
    };

    // Draw a track onto the timeline
    // Return the new jQuery track
    var drawTrack = function(trackIndex) {

        // TODO: don't draw if one already exists

        // Create a new track div and set it's data
        var audio_track = audio_tracks[trackIndex];
        console.log(audio_track);
        var new_track = $('<div></div>').attr({"id": trackID(trackIndex) , "class": trackClass});
        new_track.data(audio_track);
        $('#'+timelineID).append(new_track);

        // Set the css for the new track
        new_track.css({ "padding": 0, 
                "width": "auto",
                "height": $('#'+timelineID).height()/2 } + "px");

        // Iterate over all segments for that track and draw the segments (inside the track)
        console.log("Number of audio segments in track " + trackIndex + ": " + audio_track.audio_segments.length);
        for (var i = 0; i < audio_track.audio_segments.length; i++) {
            var jqSegment = drawSegment(trackIndex, i);
        };

        return new_track;
    };

    // Changes tickpoints into time display (ex: 00:30:00)
    // Each tickpoint unit is one second which is then scaled by the audio_timeline_scale
    var tickFormatter = function (tickpoint) {
        var sec_num = parseInt(tickpoint, 10);
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        var time    = hours+':'+minutes+':'+seconds;
        return time;
    }

    // Draw the graduation marks on the timeline
    var drawGradations = function() { 
        var timeline = $('#' + timelineID);
        var gradation_container = $('<div></div>');
        console.log("timeline width: " + timeline.width());
        gradation_container.attr('id', '#'+gradationContainerID)
            .css('width', timeline.width() + "px")
            .css('height', timeline.height() + "px")
            .css('position', 'absolute');
        timeline.append(gradation_container);

        var options = {
            series: {
                lines: { show: false },
                points: { show: true }
            },
            yaxis: {
                ticks: {show: true}
            },
            xaxis: {
                min: 0, // Min and Max refer to the range
                max: 100,
                tickFormatter: tickFormatter
            },
            grid: {
                // hoverable: true
            }
        };

        // Use flot to draw the graduations

        // Dummy data
        var plot_data = [ [0, 0], [0, 10] ];
        $.plot(gradation_container, plot_data, options);
    };

    // create cursor object for tracking mouse location
    var drawCursor = function() {
        var timeline_cursor = $('#'+timelineCursorID);
        if (timeline_cursor.length === 0) {
             timeline_cursor = $('<div></div>').attr({'id': timelineCursorID});
             $('#'+timelineID).append(timeline_cursor);
        }

        // Bind hover callback to get mouse location
        $('#'+timelineID).bind("mousemove", function (event) {

            // Set mouse position
            mouseX = event.pageX;
            mouseY = event.pageY;
            // Display bar behind mouse
            $('#'+timelineCursorID).css({
               left:  event.pageX
            });
        });
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Pubilc methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Initializes the audio controller
    // Should only be called after the document is ready
    this.init = function () {
    	console.log("initialize: pentimento_audio_controller");

    	// RecordRTC setup
		navigator.getUserMedia(
            // Constraints
            {video: false, audio: true},
            // Sucess Callback
            function(mediaStream) {
                // Initialize recordRTC
                recordRTC = RecordRTC(mediaStream, {
                    autoWriteToDisk: true
                });
            },
            // errorCallback
            function(err) {
                console.log("The following error occured: " + err);
            }
        );

    	// Button listener to start playing the audio
    	var play_pause_button = $("#play_pause_button");
		play_pause_button.click(function() { 
    	    wavesurfer.playPause();
		});

		// Button listener to record or stop the current recording
		var record_audio_button = $("#record_audio_button");
		record_audio_button.click(function() {
        	var isRecording = begin_record_time > 0;

        	// Change the button text depending on the record status
			record_audio_button.html(isRecording ? 'Record': 'Stop');
				console.log(self);

			// Start or stop recording
			if (!isRecording) {
				self.begin_recording();
			} else{
				self.end_recording();
			};
		});
    }

    // Start recording the audio at the lecture time
    this.begin_recording = function() {
        begin_record_time = globalTime();
        console.log("begin audio recording at " + begin_record_time);
        recordRTC.startRecording();
    }

    // End the recording (only applies if there is an ongoing recording)
    this.end_recording = function() {
        var end_record_time = globalTime();
        console.log("end audio recording at " + end_record_time);

        // Stop the recordRTC instance and use the callback to save the track
        recordRTC.stopRecording(function(audioURL) {
           console.log(audioURL);

            // Insert an audio track if there isn't one yet
            var track = audio_tracks[0];
            if (typeof track === 'undefined') {
                console.log('creating new audio track');
                track = new pentimento.audio_track();
                audio_tracks.push(track);
            };
            
            // Get information about the audio track from looking at the lecture state
            var audio_duration = end_record_time - begin_record_time;
            console.log("Recorded audio of length: " + String(audio_duration));

            // Insert the audio segment into the track
            var segment = new pentimento.audio_segment(audioURL, 0, audio_duration, lectureTime, lectureTime+audio_duration);
            console.log("new audio segment:");
            console.log(segment);
            track.audio_segments.push(segment);

            // Increment the lecture time by the length of the audio recording
            lectureTime += audio_duration;

            // TEMP: Try writing the audio to disk
            // saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();
        });

        // Update the audio display
        this.refresh_audio_display();

        // Reset the begin_record_time, which is used to indicate the recording status
        begin_record_time = -1;
    }

    // Refreshes the audio timeline display to show the tracks and segments
    this.refresh_audio_display = function() {

        // Clear the existing audio timeline
        $('#'+timelineID).html("");

        // Draw gradations into the timeline
        drawGradations();

        // Iterate over all audio tracks and draw them
        console.log("Number of audio tracks: " + audio_tracks.length);
        for (var i = 0; i < audio_tracks.length; i++) {
            // Draw the track and get the jquery object for that track
            var jqTrack = drawTrack(i);
        };
    };

    this.insert_segment = function (audio_segment_idx, lecture_time) {
        // Iterate over all segments for that track
        for (var j = 0; j < audio_track.audio_segments.length; j++) {
            var audio_segment = audio_track.audio_segments[i];

            // Shift all segments on the right by the length of the segment
            if ( lecture_time <= audio_segment.lecture_start_time ) {
                pentimento.audio_track.shift_segment( audio_segment.id , audio_segment.length)
            };
        };
        // Put segment at lecture_time
        audio_segment.lecture_start_time = lecture_time;
        audio_segment.lecture_end_time = lecture_time + audio_segment.length;
    };

}



$(document).ready(function() {
    pentimento.audioController = new AudioController();
    pentimento.audioController.init();
});



