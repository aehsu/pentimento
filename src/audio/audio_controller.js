var AudioController = function() {

    ////////////////////////
    // Member vars
    ////////////////////////

    // self can be used to refer to the object in different scopes (such as listeners)
    var self = this;

    // Audio model containig the audio data
    audioModel = null;

    // Controllers for each of the audio tracks. Each controller handles all the MVC
    // responsibilities for that particular track. The active controller is the
    // track controller for recording new segments into.
    var trackControllers = [];
    var activeTrackController = null;

    // RecordRTC is used to record the audio stream
    var recordRTC = null;

    // The flot object is used for plotting the graduations for the timeline
    var flotPlot = null;

    // set global mouse position in relation to page
    var mouseX = null;
    var mouseY = null;

    // The current location of the playhead in track time (milliseconds)
    var playheadTime = 0;

    // Keep track of internal recording status. 
    // This is meant to be separate from the time controller recording status in case
    // the time controller is recording but the audio is not recording.
    var isAudioRecording = false;

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

    // The minumum timeline display length in seconds
    var minumum_timeline_seconds = 100;

    // Interval durations for events and animations in milliseconds
    var playheadAnimationIntervalDuration = 10;

    // Size and layout values used for calculations (pixels)
    // These should match with any identical defined values in audio.css
    var audio_track_height = 140;  // div.audio_track{height} div.audio
    var audio_track_spacing = 20;  // Spacing between audio tracks
    var flotGraphMargin = 20;
    var flotGraphBorder = 1;

    ///////////////////////////////////////////////////////////////////////////////
    // DOM object IDs and classes
    ///////////////////////////////////////////////////////////////////////////////

    // the timeline used for displaying the audio tracks and plot ticks
    // Allows scrolling to accomodate changing timeline scales.
    var timelineID = 'audio_timeline';  

    // Cursor indicating mouse position
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
    var deleteSegmentButtonID = 'delete_segment_button';
    var insertTrackButtonID = 'insert_track_button';
    var deleteTrackButtonID = 'delete_track_button';
    var trackSelectID = 'track_select';


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Insert a new track controller with an empty track and refresh the view
    var createTrackController = function() {
        var newTrack = audioModel.createTrack();
        var newController = new AudioTrackController(newTrack, self);
        if (activeTrackController === null) {
            activeTrackController = newController;
        };
        trackControllers.push(newController);
        // Draw the new controller
        newController.draw($('#'+tracksContainerID));
        
        // Refresh the view to show any new changes in the UI
        self.refreshView();
    };

    // Remove a track controller and its track and refresh the view
    var removeTrackController = function(trackController) {
        // Check that the controller exists in the array of track controllers
        var index = trackControllers.indexOf(trackController);
        if (index < 0) {
            return;
        };

        // If the current controller is the active controller, set a new active
        if (trackController === activeTrackController) {
            for (var i = 0; i < trackControllers.length; i++) {
                // Set a controller to active if it is not the controller being deleted
                if (trackControllers[i] !== trackController) {
                    activeTrackController = trackControllers[i];
                    break;
                };
                
            };
        };

        // Delete the track from the model
        audioModel.removeTrack(trackController.getAudioTrack());

        // Remove the track controller fro the array of controllers
        trackControllers.splice(index, 1);

        // Remove the element from the DOM
        $('#'+trackController.getID()).remove();

        // Refresh the view to show any new changes in the UI
        self.refreshView();
    };

    var changeActiveTrackController = function(trackController) {
        // Make sure the track controller is in the list of track controllers
        if (trackControllers.indexOf(trackController) < 0) {
            console.log('new active track controller not in list of track controllers');
            return;
        };

        activeTrackController = trackController;

        // Refresh the view to show any new changes in the UI
        self.refreshView();
    };

    // Update the current time (ms) of the audio timeline (the time indicated by the playhead)
    // Callback method
    this.updatePlayheadTime = function(timeMilli) {
        // Check the time for valid bounds
        if (timeMilli < 0) {
            console.error("Invalid playhead time: " + timeMilli);
            return;
        };

        // Update the value of the playhead
        playheadTime = timeMilli;

        // Refresh the playhead position
        refreshPlayhead();
    };

    // Start recording the audio at the given track time (ms)
    // Callback method registered to the time controller
    this.beginRecording = function(time) {
        console.log("Begin audio recording: " + time);

        // This method can only be called if the time controller is recording and a recording is not currently in progress
        if ( !pentimento.timeController.isRecording() || isAudioRecording ) {
            console.error("Cannot begin recording");
            return;
        };

        isAudioRecording = true;

        // Disable editing
        disableEditUI();

        // Stop playback if it is in progress
        if (isPlayingBack) {
            self.stopPlayback();
        };

        // Insert an audio track controller if there isn't one yet. 
        // This also makes it the recording track controller
        if (activeTrackController === null) {
            console.log('creating new recording track controller');
            createTrackController();
        };

        // Use recordRTC to start the actual audio recording
        recordRTC.startRecording();

        // TODO: Add an indicator in the selected track to show the duration of the recording
    };

    // End the recording (only applies if there is an ongoing recording)
    // Callback method registered to the time controller
    this.endRecording = function(beginTime, endTime) {
        console.log("End audio recording (" + beginTime + ", " + endTime + ")");

        // This method can only be called if the time controller is not recording and a recording is currently in progress
        if ( pentimento.timeController.isRecording() || !isAudioRecording ) {
            console.error("Cannot end recording");
            return;
        };

        isAudioRecording = false;

        // Reenable editing
        enableEditUI();

        // Stop the recordRTC instance and use the callback to save the track
        recordRTC.stopRecording(function(audioURL) {
            console.log(audioURL);            
            var audio_duration = endTime - beginTime;
            console.log("Recorded audio of length: " + String(audio_duration));

            // Create a new audio segment and use the track controller to insert it
            var segment = new pentimento.audio_segment(audioURL, audio_duration, beginTime, endTime);
            console.log("new audio segment:");
            console.log(segment);
            activeTrackController.insertSegment(segment);

            // TEMP: Try writing the audio to disk
            // saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();
        });

        // Refresh the audio display
        self.refreshView();
    };

    // Start the playback at the current playhead location
    this.startPlayback = function() {
        console.log("AudioController: Start playback");

        // Don't start playback if already in progress or if recording
        if (isPlayingBack || isAudioRecording) {
            console.error("Cannot start playback");
            return;
        };
        isPlayingBack = true;

        // Disable editing
        disableEditUI();

        // Update the button display
        $('#'+playPauseButtonID).html('Stop Audio');

        // Find the track time when the playback should end
        // Get the greatest end time in all of the tracks
        var playbackEndTime = -1;
        for (var i = 0; i < trackControllers.length; i++) {
            playbackEndTime = Math.max(playbackEndTime, trackControllers[i].getLength());
        };

        // Calculate the duration of the playback and the end location in pixels
        var playbackDuration = playbackEndTime-playheadTime;
        var playbackEndPixel = self.millisecondsToPixels(playbackEndTime);

        // Start the playhead animation and update the time controller's time at each interval
        // Call the stopPlayback method when finished
        $('#'+playheadID).animate({left: playbackEndPixel+'px'}, 
                                {duration: playbackDuration,
                                easing:'linear',
                                progress:function() {
                                    var newTrackTime = self.pixelsToMilliseconds($('#'+playheadID).position().left);
                                    pentimento.timeController.updateTime(newTrackTime);
                                },
                                always:self.stopPlayback});

        // Start the track playback for each track controller
        for (var i = 0; i < trackControllers.length; i++) {
            var trackController = trackControllers[i];
            trackController.startPlayback(playheadTime, playbackEndTime);
        };
    };

    // Stop all playback activity
    this.stopPlayback = function() {
        console.log("AudioController: Stop playback");

        // Don't stop playback if not already in progress
        if (isPlayingBack === false) {
            console.error("Cannot stop playback");
            return;
        };
        isPlayingBack = false;

        // Reenable editing
        enableEditUI();

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
        return Math.round((1000*pixels)/timeline_pixels_per_sec);
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

    // Disable all UI functionality for editing audio
    // Used during recording and playback
    var disableEditUI = function() {
        // Disable all jQuery draggable elements in the audio timeline
        $('#'+timelineID+' .ui-draggable').draggable('disable');

        // Disable all jQuery resizable elements in the audio timeline
        $('#'+timelineID+' .ui-resizable').resizable('disable');

        // Disable certain buttons
        $('#'+deleteSegmentButtonID).prop('disabled', true);
        $('#'+insertTrackButtonID).prop('disabled', true);
        $('#'+deleteTrackButtonID).prop('disabled', true);
    };

    // Enable all UI functionality for editing audio
    // Used when recording or playback ends
    var enableEditUI = function() {
        // Enable all jQuery draggable elements in the audio timeline
        $('#audio_timeline .ui-draggable').draggable('enable');

        // Enable all jQuery resizable elements in the audio timeline
        $('#audio_timeline .ui-resizable').resizable('enable');

        // Enable certain buttons
        $('#'+deleteSegmentButtonID).prop('disabled', false);
        $('#'+insertTrackButtonID).prop('disabled', false);
        $('#'+deleteTrackButtonID).prop('disabled', false);
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
            .css('height', flotPlot.height())
            .css('position', 'absolute');
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
        var gradation_container = $('#'+gradationContainerID);

        // Figure out how many seconds to display in the timeline.
        // This should be twice as long as the longest track, or at least 100 seconds.
        var longestTrackLength = 0;
        for (var i = 0; i < trackControllers.length; i++) {
            longestTrackLength = Math.max(trackControllers[i].getLength(), longestTrackLength);
        };
        var timelineLengthSeconds = Math.max(2*longestTrackLength/1000, minumum_timeline_seconds);
        console.log("timelineLengthSeconds: " + timelineLengthSeconds);

        // Set the width of the gradations container so that it can fit the entire range of timelineLengthSeconds.
        // Set the height of the gradations container so that it can fit all the current tracks, with a minimum height of two tracks.
        // Plus the margin and border widths (2 each).
        var marginAndBorderSize = 2 * (flotGraphMargin + flotGraphBorder);
        var widthPixels = (timelineLengthSeconds * timeline_pixels_per_sec) + marginAndBorderSize;
        var heightPixels = (Math.max(audioModel.audio_tracks.length, 2) * (audio_track_height + audio_track_spacing)) + marginAndBorderSize;
        gradation_container.css('width', widthPixels);
        gradation_container.css('height', heightPixels);

        // Options for initializing flot
        // The range of the plot is set to timelineLengthSeconds
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
                max: timelineLengthSeconds,
                tickFormatter: tickFormatter,
                labelHeight: 10,
            },
            grid: {
                // hoverable: true
                margin: {
                top: flotGraphMargin,
                left: flotGraphMargin,
                bottom: flotGraphMargin,
                right: flotGraphMargin
                },
                minBorderMargin: 0,
                borderWidth: flotGraphBorder,
                labelMargin: 10,
            }
        };

        // Dummy data just for initiating the flot.
        var plot_data = [ [0, 0], [0, timelineLengthSeconds] ];

        // Use flot to draw the graduations
        flotPlot = $.plot(gradation_container, plot_data, options);

        // Resize flot to fit the parent container
        flotPlot.resize();
        flotPlot.setupGrid();
        flotPlot.draw();
    };

    // Draw the graduation marks on the timeline
    var drawGradations = function() { 
        var timeline = $('#' + timelineID);
        var gradation_scroll_parent = $('<div></div>');
        var gradation_container = $('<div></div>');
        gradation_container.attr('id', gradationContainerID);
        timeline.append(gradation_container);

        // Refresh parameters
        refreshGradations();
    };

    // Refresh the playhead position
    var refreshPlayhead = function() {
        var jqPlayhead = $('#'+playheadID);
        jqPlayhead.css('left', self.millisecondsToPixels(playheadTime));
    };

    // draw the playhead for showing playback location
    var drawPlayhead = function() {
        // Create the playhead and append it to the timeline
        var playhead = $('<div></div>').attr({'id': playheadID});
        $('#'+tracksContainerID).append(playhead);  

        // Set the playhead to be draggable in the x-axis within the tracksContainer
        playhead.draggable({ axis: "x",
                            containment: '#'+tracksContainerID,
                            drag: function() {
                                // Update the time controller during dragging
                                var newTrackTime = self.pixelsToMilliseconds($('#'+playheadID).position().left);
                                pentimento.timeController.updateTime(newTrackTime);
                            }
                        });      

        // Make sure the playhead is always on top
        playhead.css('z-index', '1000');

        // Refreshe the playhead to update the position
        refreshPlayhead();
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

        // Update the measurement for pixels per second
        timeline_pixels_per_sec = newPixelsPerSec;       

        // Refreshing will update the size of the segments and wavesurfers
        // as well as the gradations.
        self.refreshView();
    };

    // Refreshes the view to reflect changes in the audio model.
    // This only changes the tracks and segments parts of the view because the other parts are
    // not dependent on model data.
    this.refreshView = function() {

        // Refresh each of the tracks
        for (var i = 0; i < trackControllers.length; i++) {
            trackControllers[i].refreshView();
            // Offset the top of the track by the size of the other tracks before it
            $('#'+trackControllers[i].getID()).css('top', i * (audio_track_height + audio_track_spacing));
        };

        // Refresh the gradations
        refreshGradations();

        // Refresh the playhead
        refreshPlayhead();

        // Refresh the tracks container
        refreshTracksContainer();

        // Update the number of tracks in the track selector by appending the options
        var trackSelect = $('#'+trackSelectID);
        trackSelect.html('');
        for (var i = 0; i < trackControllers.length; i++) {
            var option = $('<option value="'+(i+1)+'">'+(i+1)+'</option>');
            trackSelect.append(option);
            // If the current track option is active, select it to be selected.
            if (trackControllers[i] === activeTrackController) {
                trackSelect.val(i+1);
            };
        };
    };

    // Draws all parts of the timeline into the page.
    // Removes all parts of the existing view if it has already been drawn.
    this.draw = function(display_window) {

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
        self.refreshView();
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

    // Register callbacks with the time controller
    pentimento.timeController.addUpdateTimeCallback(self.updatePlayheadTime);
    pentimento.timeController.addBeginRecordingCallback(self.beginRecording);
    pentimento.timeController.addEndRecordingCallback(self.endRecording);

    // Button listener to start playing the audio
    var play_pause_button = $('#'+playPauseButtonID);
    play_pause_button.html('Play Audio');
    play_pause_button.click(function() { 
        if (pentimento.timeController.isRecording()) {
            return;
        };
        if (isPlayingBack) {
            self.stopPlayback();
        } else {
            self.startPlayback();
        };
    });

    // Button listener to record or stop the current recording
    var record_audio_button = $('#'+recordAudioButtonID);
    record_audio_button.click(function() {

        // Change the button text depending on the record status
        record_audio_button.html(pentimento.timeController.isRecording() ? 'Record': 'Stop');
            console.log(self);

        // Start or stop recording
        if (!pentimento.timeController.isRecording()) {
            pentimento.timeController.startRecording();
        } else{
            pentimento.timeController.stopRecording();
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

    // Button listeners for deleting an audio segment
    var deleteSegmentButton = $('#'+deleteSegmentButtonID);
    deleteSegmentButton.click(function() {
        // For each track, remove the segments that have focus
        for (var i = 0; i < trackControllers.length; i++) {
            trackControllers[i].removeFocusedSegments(); 
        };
    });

    // Listeners for inserting and deleting a track
    var insertTrackButton = $('#'+insertTrackButtonID);
    insertTrackButton.click(function() {
        createTrackController();
    });
    var deleteTrackButton = $('#'+deleteTrackButtonID);
    deleteTrackButton.click(function() {
        removeTrackController(activeTrackController);
    });

    // Selected the active track
    var trackSelect = $('#'+trackSelectID);
    trackSelect.change(function() {
        var newActiveTrackIndex = (parseInt(trackSelect.val()) - 1);
        console.log("new active track index: " + newActiveTrackIndex );
        changeActiveTrackController(trackControllers[newActiveTrackIndex]);
    });

    // Draw the view
    self.draw();
};


$(document).ready(function() {
    pentimento.audioController = new AudioController();
});

