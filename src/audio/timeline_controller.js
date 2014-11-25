var AudioTimelineController = function() {

    ////////////////////////
    // Member vars
    ////////////////////////

	// self can be used to refer to the object in different scopes (such as listeners)
	var self = this;

	// Audio controller for managing the audio model
    var audioController = null;

	// RecordRTC is used to record the audio stream
	var recordRTC = null;

    // The flot object is used for plotting the graduations for the timeline
    var flotPlot = null;

    // set global mouse position in relation to page
    var mouseX = null;
    var mouseY = null;

    // begin_record_time is the global time when the recording was started
    // The time is in milliseconds UTC
    // -1 indicates that there is no recording in progress
    var begin_record_time = -1;

    // lecture time when the recording began in milliseconds
    var lectureBeginRecordTime = 0;

    // Playhead values (the thing which indicates the current location in playback)
    var playheadLectureTime = 0;  // The current location of the playhead in lecture time

    // Keep track of the playback status
    var isPlayingBack = false;

    // Keep track of the timer IDs used for playback
    // These should get cancelled when playback is stopped and the array emptied
    var segmentPlaybackTimeoutIDs = [];

    // The scale of the timeline in pixels per second
    var timeline_pixels_per_sec = 10;

    // Interval durations for events and animations in milliseconds
    var playheadAnimationIntervalDuration = 10;


    ///////////////////////////////////////////////////////////////////////////////
    // DOM object IDs and classes
    ///////////////////////////////////////////////////////////////////////////////

    // the timeline used for displaying the audio tracks and plot ticks
    var timelineID = 'audio_timeline';  

    // TODO
    var timelineCursorID = 'audio_timeline_cursor';

    // audio tracks display, contained by audio_timeline
    // contained inside audio_timeline
    var tracksContainerID = 'audio_tracks_container';  

    // plot used for showing the timeline ticks
    // contained inside audio_timeline
    var gradationContainerID = 'gradation_container';  

    // playhead that shows the current location of the play
    // contained inside audio_tracks_container
    var playheadID = 'playhead';  

    // Buttons
    var playPauseButtonID = 'play_pause_button';
    var recordAudioButtonID = 'record_audio_button';



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

    // Draw the container that will be used to hold the tracks
    var drawTracksContainer = function() {
        var timeline = $('#' + timelineID);
        var tracksContainer = $('<div></div>');
        tracksContainer.attr('id', tracksContainerID);
        // The position and size is set to overlay and fit the gradation container
        // The flotPlot.offset() function only returns the global offset, so we
        // need to subtract the offset of the gradation_container
        var gradationContainer = $('#'+gradationContainerID);
        tracksContainer.css('left', flotPlot.offset().left - gradationContainer.offset().left)
            .css('top', flotPlot.offset().top - gradationContainer.offset().top)                  
            .css('width', flotPlot.width())
            .css('height', flotPlot.height());
        timeline.append(tracksContainer);
    };

    // Draw the graduation marks on the timeline
    var drawGradations = function() { 
        var timeline = $('#' + timelineID);
        var gradation_container = $('<div></div>');
        gradation_container.attr('id', gradationContainerID)
            .css('width', timeline.width())
            .css('height', timeline.height());
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
                tickFormatter: tickFormatter,
                labelHeight: 10,
            },
            grid: {
                // hoverable: true
                margin: {
                top: 20,
                left: 20,
                bottom: 20,
                right: 20
                },
                minBorderMargin: 0,
                borderWidth: 1,
                labelMargin: 10,
            }
        };

        // Dummy data
        var plot_data = [ [0, 0], [0, 10] ];

        // Use flot to draw the graduations
        flotPlot = $.plot(gradation_container, plot_data, options);
    };

    // Function to update the playhead lecture time during dragging or play
    var updatePlayheadTime = function() {
        var playhead = $('#'+playheadID);
        playheadLectureTime = pixelsToMilliseconds(playhead.position().left);
    };

    // draw the playhead for showing playback location
    var drawPlayhead = function() {
        // Create the playhead and append it to the timeline
        var playhead = $('<div></div>').attr({'id': playheadID});
        $('#'+tracksContainerID).append(playhead);  

        // Set the playhead to be draggable in the x-axis within the tracksContainer
        playhead.draggable({ axis: "x",
                            containment: '#'+tracksContainerID,
                            drag: updatePlayheadTime,
                            start: updatePlayheadTime,
                            stop: updatePlayheadTime});      
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

    // Returns a funtion to play the next segment in the track
    // var playNextSegmentIn

    ///////////////////////////////////////////////////////////////////////////////
    // Pubilc methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Initializes the audio controller
    // Should only be called after the document is ready
    this.init = function () {

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
    	var play_pause_button = $('#'+playPauseButtonID);
        play_pause_button.html('Play Audio');
		play_pause_button.click(function() { 
            if (isPlayingBack) {
                self.stopPlayback();
            } else {
                self.startPlayback();
            };
		});

		// Button listener to record or stop the current recording
		var record_audio_button = $('#'+recordAudioButtonID);
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
    };

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
            var segment = new pentimento.audio_segment(audioURL,0,audio_duration,lectureBeginRecordTime,lectureBeginRecordTime+audio_duration);
            console.log("new audio segment:");
            console.log(segment);
            track.audio_segments.push(segment);

            // Increment the lecture time by the length of the audio recording
            // TODO remove this, this should be set by the playhead instead
            lectureBeginRecordTime += audio_duration;

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

        // Draw the container for the audio tracks
        drawTracksContainer();

        // Iterate over all audio tracks and draw them
        console.log("Number of audio tracks: " + audio_tracks.length);
        for (var i = 0; i < audio_tracks.length; i++) {
            // Draw the track and get the jquery object for that track
            var jqTrack = drawTrack(i);
        };

        // Show the playhead that is used to display the current position in the timeline
        drawPlayhead();
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

    // Start the playback at the current playhead location
    this.startPlayback = function() {
        // Don't start playback if already in progress
        if (isPlayingBack == true) {
            return;
        };
        isPlayingBack = true;

        // Update the button display
        $('#'+playPauseButtonID).html('Stop Audio');

        // Find the lecture time when the playback should end
        // Get the greatest end time in all of the tracks
        var playbackLectureEndTime = -1;
        for (var i = 0; i < audio_tracks.length; i++) {
            playbackLectureEndTime = Math.max(playbackLectureEndTime, audio_tracks[i].endTimeLecture());
        };

        // Calculate the duration of the playback and the end location in pixels
        var playbackDuration = playbackLectureEndTime-playheadLectureTime;
        var playbackEndPixel = millisecondsToPixels(playbackLectureEndTime);
        console.log("Playback end time: " + playbackLectureEndTime);
        console.log("Playback end pixel: " + playbackEndPixel);


        // Start the playhead animation and update the playhead time at each interval
        // Call the stopPlayback method when finished
        $('#'+playheadID).animate({left: playbackEndPixel+'px'}, 
                                {duration: playbackDuration,
                                easing:'linear',
                                progress:updatePlayheadTime,
                                always:self.stopPlayback});

        // Start the track playback for each segment in each track
        for (var i = 0; i < audio_tracks.length; i++) {
            var track = audio_tracks[i];
            for (var j = 0; j < track.audio_segments.length; j++) {
                var segment = track.audio_segments[j];
                var segmentWavesurfer = wavesurfers[i][j];

                // Get the delay in milliseconds from now until when the playback will occur
                // Compute the start time of the audio (sometimes starts play in middle of segment)
                var playbackDelay;
                var audioStartTime;
                // If the segment starts after the current playhead time
                if (segment.lecture_start_time >= playheadLectureTime) {
                    playbackDelay = segment.lecture_start_time - playheadLectureTime;
                    audioStartTime = segment.audio_start_time;
                }
                // If the playhead time is in the middle of the segment 
                else if (segment.lecture_end_time > playheadLectureTime) {
                    playbackDelay = 0;
                    audioStartTime = segment.audio_start_time + (playheadLectureTime-segment.lecture_start_time);
                }
                // If the playhead time is after the entire segment
                else {
                    // Don't even play this segment
                    continue;
                };

                // Generate a function used for playback to be registered with a timer
                var playbackSegment = function(audioSegment, wavesurfer, startTimeAudio) {
                    var result = function() {
                        // Play the wavesurfer over the specified range
                        wavesurfer.play(startTimeAudio, audioSegment.audio_end_time);
                        console.log("playback start time in audio: " + startTimeAudio);
                        console.log(segment);
                    };
                    return result;
                }(segment, segmentWavesurfer, audioStartTime);

                // Register a timer and save the timeout ID so it can be cancelled
                var timeoutID = setTimeout(playbackSegment, playbackDelay);
                segmentPlaybackTimeoutIDs.push(timeoutID);
            };
        };
    };

    this.stopPlayback = function() {
        // Don't stop playback if not already in progress
        if (isPlayingBack == false) {
            return;
        };
        isPlayingBack = false;

        console.log("Stop playback");

        // Update the button text
        $('#'+playPauseButtonID).html('Play Audio');

        // Stop the playhead animation
        $('#'+playheadID).stop();

        // Stop all of currently running segment playbacks
        // Loop through all wavesurfers only because we don't store the currently playing ones
        for (var i = 0; i < wavesurfers.length; i++) {
            var trackWavesurfers = wavesurfers[i];
            for (var j = 0; j < trackWavesurfers.length; j++) {
                console.log("ws curtime " + trackWavesurfers[j].getCurrentTime());
                if (trackWavesurfers[j].getCurrentTime() != 0) {
                    trackWavesurfers[j].stop();
                };
            };
        };

        // Stop all of the pending playbacks
        for (var i = 0; i < segmentPlaybackTimeoutIDs.length; i++) {
            clearTimeout(segmentPlaybackTimeoutIDs[i]);
        };
        segmentPlaybackTimeoutIDs = [];
    };

};



$(document).ready(function() {
    pentimento.audioTimelineController = new AudioTimelineController();
    pentimento.audioTimelineController.init();
});



