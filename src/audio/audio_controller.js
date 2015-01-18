var AudioController = function() {

    ////////////////////////
    // Member vars
    ////////////////////////

    // self can be used to refer to the object in different scopes (such as listeners)
    var self = this;

    // Audio model containig the audio data
    var audioModel = null;

    // Controllers for each of the audio tracks. Each controller handles all the MVC
    // responsibilities for that particular track. The recording controller is the
    // active controller for recording new segments into.
    var trackControllers = [];
    var recordingTrackController = null;

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

    // Limits for the timeline scale
    var timeline_min_mixels_per_sec = 4
    var timeline_max_pixels_per_sec = 150

    // The scale factor when zooming on the timeline
    var timeline_zoom_factor = 1.5;

    // Interval durations for events and animations in milliseconds
    var playheadAnimationIntervalDuration = 10;


    ///////////////////////////////////////////////////////////////////////////////
    // DOM object IDs and classes
    ///////////////////////////////////////////////////////////////////////////////

    // the timeline used for displaying the audio tracks and plot ticks
    // Allows scrolling to accomodate changing timeline scales.
    var timelineID = 'audio_timeline';  

    // TODO
    var timelineCursorID = 'audio_timeline_cursor';

    // audio tracks display, contained by audio_timeline
    // contained inside audio_timeline
    var tracksContainerID = 'audio_tracks_container';  

    // plot used for showing the timeline ticks
    // contained inside audio_timeline.
    var gradationContainerID = 'gradation_container';  

    // playhead that shows the current location of the play
    // contained inside audio_tracks_container
    var playheadID = 'playhead';  

    // Buttons
    var playPauseButtonID = 'play_pause_button';
    var recordAudioButtonID = 'record_audio_button';
    var zoomInButtonID = 'zoom_in_button';
    var zoomOutButtonID = 'zoom_out_button';


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Insert a new track controller with an empty track and return the new controller
    var createTrackController = function() {
        var newTrack = audioModel.createTrack();
        var newController = new AudioTrackController(newTrack);
        if (recordingTrackController === null) {
            recordingTrackController = newController;
        };
        trackControllers.push(newController);
        // Draw the new controller
        newController.draw($('#'+tracksContainerID));
        return newController;
    };

    // Remove a track controller and its track
    var removeTrackController = function(trackController) {
        // If the current controller is the recording controller,
        // set another controller to be recording.
        // TODO
    };

    // Start recording the audio at the lecture time
    this.begin_recording = function() {

        // Stop playback if it is in progress
        this.stopPlayback();

        // Insert an audio track controller if there isn't one yet. 
        // This also makes it the recording track controller
        if (recordingTrackController === null) {
            console.log('creating new recording track controller');
            createTrackController();
        };

        begin_record_time = globalTime();
        console.log("begin audio recording at " + begin_record_time);
        recordRTC.startRecording();

        // TODO: Add an indicator in the selected track to show the duration of the recording
    };

    // End the recording (only applies if there is an ongoing recording)
    this.end_recording = function() {
        var end_record_time = globalTime();
        console.log("end audio recording at " + end_record_time);

        // Stop the recordRTC instance and use the callback to save the track
        recordRTC.stopRecording(function(audioURL) {
           console.log(audioURL);
            
            // Get information about the recording audio track from looking at the lecture state
            var audio_duration = end_record_time - begin_record_time;
            console.log("Recorded audio of length: " + String(audio_duration));

            // Create a new audio segment and use the track controller to insert it
            var segment = new pentimento.audio_segment(audioURL,0,audio_duration,lectureBeginRecordTime,
                                                    lectureBeginRecordTime+audio_duration);
            console.log("new audio segment:");
            console.log(segment);
            recordingTrackController.insertSegmentController(segment);

            // Increment the lecture time by the length of the audio recording
            // TODO remove this, this should be set by the playhead instead
            lectureBeginRecordTime += audio_duration;

            // TEMP: Try writing the audio to disk
            // saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();
        });

        // Refresh the audio display
        this.refreshView();

        // Reset the begin_record_time, which is used to indicate the recording status
        begin_record_time = -1;
    };

    // Start the playback at the current playhead location
    this.startPlayback = function() {
        // Don't start playback if already in progress
        if (isPlayingBack == true) {
            return;
        };
        isPlayingBack = true;

        console.log("AudioController: Start playback");

        // Update the button display
        $('#'+playPauseButtonID).html('Stop Audio');

        // Find the lecture time when the playback should end
        // Get the greatest end time in all of the tracks
        var playbackLectureEndTime = -1;
        for (var i = 0; i < trackControllers.length; i++) {
            playbackLectureEndTime = Math.max(playbackLectureEndTime, trackControllers[i].getLength());
        };

        // Calculate the duration of the playback and the end location in pixels
        var playbackDuration = playbackLectureEndTime-playheadLectureTime;
        var playbackEndPixel = this.millisecondsToPixels(playbackLectureEndTime);

        // Start the playhead animation and update the playhead time at each interval
        // Call the stopPlayback method when finished
        $('#'+playheadID).animate({left: playbackEndPixel+'px'}, 
                                {duration: playbackDuration,
                                easing:'linear',
                                progress:updatePlayheadTime,
                                always:self.stopPlayback});

        // Start the track playback for each track controller
        for (var i = 0; i < trackControllers.length; i++) {
            var trackController = trackControllers[i];
            trackController.startPlayback(playheadLectureTime, playbackLectureEndTime);
        };
    };

    // Stop all playback activity
    this.stopPlayback = function() {
        // Don't stop playback if not already in progress
        if (isPlayingBack == false) {
            return;
        };
        isPlayingBack = false;

        console.log("AudioController: Stop playback");

        // Update the button text
        $('#'+playPauseButtonID).html('Play Audio');

        // Stop the playhead animation
        $('#'+playheadID).stop();

        // Stop all of track controller playbacks
        for (var i = 0; i < trackControllers.length; i++) {
            var trackController = trackControllers[i];
            trackController.stopPlayback();
        };
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Drawing methods
    ///////////////////////////////////////////////////////////////////////////////

    // Convert milliseconds to pixels according to the current scale
    this.millisecondsToPixels = function(millSec) {
        return Math.round((millSec/1000.0) * timeline_pixels_per_sec);
    };

    // Convert pixels to milliseconds according to the current scale
    this.pixelsToMilliseconds = function(pixels) {
        return 1000*(pixels/timeline_pixels_per_sec);
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
    };

    // Refresh the size of the tracks container
    var refreshTracksContainer = function() {
        var tracksContainer = $('#'+tracksContainerID);
        var gradationContainer = $('#'+gradationContainerID);
        // The position and size is set to overlay and fit the gradation container
        // The flotPlot.offset() function only returns the global offset, so we
        // need to subtract the offset of the gradation_container
        tracksContainer.css('left', flotPlot.offset().left - gradationContainer.offset().left)
            .css('top', flotPlot.offset().top - gradationContainer.offset().top)                  
            .css('width', flotPlot.width())
            .css('height', flotPlot.height());
    };

    // Draw the container that will be used to hold the tracks
    // Return the jquery tracks container object.
    var drawTracksContainer = function() {
        var timeline = $('#' + timelineID);
        var tracksContainer = $('<div></div>');
        tracksContainer.attr('id', tracksContainerID);
        timeline.append(tracksContainer);

        // Refresh parameters related to size
        refreshTracksContainer();

        return tracksContainer;
    };

    // Refresh the gradation container to account for changes in the zoom scale.
    var refreshGradations = function() {
        // TODO: incorporate the changes from zoom into this function, which should be called from refresh and draw
        flotPlot.resize();
        flotPlot.setupGrid();
        flotPlot.draw();
    };

    // Draw the graduation marks on the timeline
    var drawGradations = function() { 
        var timeline = $('#' + timelineID);
        var gradation_scroll_parent = $('<div></div>');
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

        // Refresh parameters
        refreshGradations();
    };

    // Function to update the playhead lecture time during dragging or play
    // Callback method
    var updatePlayheadTime = function() {
        var playhead = $('#'+playheadID);
        playheadLectureTime = self.pixelsToMilliseconds(playhead.position().left);
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

    // Zoom in or out.
    // Input true to indicate zoom out (default)
    this.zoom = function(zoomOut) {
        if(typeof(zoomOut)!=='boolean') zoomOut = true;

        // Set the zoom factor based on whether we are zooming in or out
        var zoomFactor = (zoomOut ? timeline_zoom_factor : 1/timeline_zoom_factor);

        // Check if the new scale is within range before proceeding
        var newPixelsPerSec = timeline_pixels_per_sec / zoomFactor;
        if (newPixelsPerSec < timeline_min_mixels_per_sec || 
            newPixelsPerSec > timeline_max_pixels_per_sec) {
            return;
        };

        // Update the size of the gradations container and tracks container
        // TODO: should be moved to refresh view with another parameter to set the size
        var gradation_container = $('#'+gradationContainerID);
        gradation_container.width(gradation_container.width() / zoomFactor);

        // Update the measurement for pixels per second
        timeline_pixels_per_sec = newPixelsPerSec;       

        // Refreshing will update the size of the segments and wavesurfers
        // as well as the gradations.
        this.refreshView();
    };

    // Refreshes the view to reflect changes in the audio model.
    // This only changes the tracks and segments parts of the view because the other parts are
    // not dependent on model data.
    this.refreshView = function() {

        // Refresh each of the tracks
        for (var i = 0; i < trackControllers.length; i++) {
            trackControllers[i].refreshView();
        };

        // Refresh the gradations
        refreshGradations();

        // Refresh the tracks container
        refreshTracksContainer();
    };

    // Draws all parts of the timeline into the page.
    // Removes all parts of the existing view if it has already been drawn.
    this.draw = function() {

        // Clear the existing audio timeline
        $('#'+timelineID).html("");

        // Draw gradations into the timeline
        drawGradations();

        // Draw the container for the audio tracks
        var jqTracksContainer = drawTracksContainer();

        // Iterate over all audio tracks and draw them
        for (var i = 0; i < trackControllers.length; i++) {
            // Draw the track and get the jquery object for that track
            console.log("Drawing track  " + i);
            var jqTrack = trackControllers[i].draw(jqTracksContainer);
        };

        // Show the playhead that is used to display the current position in the timeline
        drawPlayhead();

        // Refresh the view
        this.refreshView();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    // Initializes the audio controller
    // Should only be called after the document is ready

    // Create a new audio model
    audioModel = new pentimento.audio_model();

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

    // Button listeners for zooming in and out
    var zoom_in_button = $('#'+zoomInButtonID);
    zoom_in_button.click(function() {
        self.zoom(false);  // false indicates zoom in
    });
    var zoom_out_button = $('#'+zoomOutButtonID);
    zoom_out_button.click(function() {
        self.zoom(true);  // true indicates zoom out
    });

    // Draw the view
    this.draw();

};


$(document).ready(function() {
    pentimento.audioController = new AudioController();
});

