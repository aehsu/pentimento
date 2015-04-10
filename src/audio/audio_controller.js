///////////////////////////////////////////////////////////////////////////////
// Audio Controller
//
// Controller for the DOM audio timeline
// Translates user input into actions that modify the audio model
// Responsible for drawing the audio timeline and displaying updates
"use strict";
var AudioController = function(audio_model) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member vars
    ///////////////////////////////////////////////////////////////////////////////

    // self can be used to refer to the object in different scopes (such as listeners)
    var self = this;

    // Audio model containig the audio data
    var audioModel = null;

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

    // Keep track of the timer IDs used for playback
    // These should get cancelled when playback is stopped and the array emptied
    var segmentPlaybackTimeoutIDs = [];

    // The scale of the timeline in pixels per second
    var timeline_pixels_per_sec = 40;

    // Limits for the timeline scale
    var timeline_min_mixels_per_sec = 4
    var timeline_max_pixels_per_sec = 150

    // The scale factor when zooming on the timeline
    var timeline_zoom_factor = 1.5;

    // The minumum timeline display length in seconds
    var minumum_timeline_seconds = 100;

    // Interval durations for events and animations in milliseconds
    var playheadAnimationIntervalDuration = 10;

    // See the section on Timeline Plugins below
    var timelinePlugins = [];

    // Size and layout values used for calculations (pixels)
    // These should match with any identical defined values in audio.css
    var audio_track_height = 100;  // div.audio_track{height} div.audio
    var audio_track_spacing = 10;  // Spacing between audio tracks (and plugins)
    var flotGraphMargin = 20;
    var flotGraphBorder = 2;
    var flotLabelMargin = 10;  // Margin for the time labels at the bottom
    var flotLabelHeight = 10;  // Height of the time labels at the bottom

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

    // Timeline Plugins
    var timelinePluginIDBase = 'timeline_plugin_';  // A number follows the base (e.g. timeline_plugin_0)
    var timelinePluginClass = 'timeline_plugin';


    ///////////////////////////////////////////////////////////////////////////////
    // Managing audio methods
    /////////////////////////////////////////////////////////////////////////////// 

    // Get the audio model that holds all the audio information
    var getAudioModel = function() {
        return audioModel;
    };

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

        // Try removing the track from the model
        var result = audioModel.removeTrack(trackController.getAudioTrack());
        if (!result) {
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
    var updatePlayheadTime = function(currentTime) {
        // Check the time for valid bounds
        if (currentTime < 0) {
            console.error("Invalid playhead time: " + currentTime);
            return;
        };

        // Update the value of the playhead
        playheadTime = currentTime;

        // Refresh the playhead position
        refreshPlayhead();
    };

    // Start recording the audio at the given track time (ms)
    // Callback method registered to the time controller
    var startRecording = function(currentTime) {
        console.log("Begin audio recording: " + currentTime);

        // This method can only be called if the time controller is recording and a recording is not currently in progress
        if ( !pentimento.timeController.isRecording() || isAudioRecording ) {
            console.error("Cannot begin recording");
            return;
        };

        isAudioRecording = true;
        $('#'+recordAudioButtonID).html('Stop');

        // Disable editing
        disableEditUI();

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
    var stopRecording = function(currentTime) {
        var beginTime = pentimento.timeController.getBeginTime();
        var endTime = currentTime;
        console.log("End audio recording (" + beginTime + ", " + endTime + ")");

        // This method can only be called if the time controller is not recording and a recording is currently in progress
        if ( pentimento.timeController.isRecording() || !isAudioRecording ) {
            console.error("Cannot end recording");
            return;
        };

        isAudioRecording = false;
        $('#'+recordAudioButtonID).html('Record');

        // Reenable editing
        enableEditUI();

        // Stop the recordRTC instance and use the callback to save the track
        recordRTC.stopRecording(function(audioURL) {
            console.log(audioURL);            
            var audio_duration = endTime - beginTime;
            console.log("Recorded audio of length: " + String(audio_duration));

            // Create a new audio segment and use the track controller to insert it
            var segment = new AudioSegment(audioURL, audio_duration, beginTime, endTime);
            console.log("new audio segment:");
            console.log(segment);
            activeTrackController.insertSegment(segment);

            // Refresh the audio display
            self.refreshView();

            // TEMP: Try writing the audio to disk
            // saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();
        });
    };

    // Begin playback the audio at the given track time (ms)
    // Callback method registered to the time controller
    var startPlayback = function(currentTime) {
        console.log("AudioController: Start playback");

        // This method can only be called if the time controller is playing and a recording is not currently in progress
        if ( !pentimento.timeController.isPlaying() || isAudioRecording ) {
            console.log(pentimento.timeController.isPlaying());
            console.error("Cannot begin playback");
            return;
        };

        play_pause_button.html('Pause');

        // Disable editing
        disableEditUI();

        // Start the track playback for each track controller
        for (var i = 0; i < trackControllers.length; i++) {
            var trackController = trackControllers[i];
            trackController.startPlayback(playheadTime);
        };
    };

    // Stop all playback activity
    var stopPlayback = function(currentTime) {
        console.log("AudioController: Stop playback");

        // This method can only be called if the time controller is not playing and a recording is not currently in progress
        if ( pentimento.timeController.isPlaying() || isAudioRecording ) {
            console.error("Cannot end playback");
            return;
        };

        play_pause_button.html('Play');

        // Reenable editing
        enableEditUI();

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
        $('#'+timelineID+' .ui-draggable').draggable('enable');

        // Enable all jQuery resizable elements in the audio timeline
        $('#'+timelineID+' .ui-resizable').resizable('enable');

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

    // Get the offset (pixels) from the top of the tracks container for the nth plugin
    // Using a pluginIndex equal to the number of plugins will return the offset needed
    // by the tracks that are drawn under the plugins.
    var pluginTopOffset = function(pluginIndex) {

        if (pluginIndex < 0 || pluginIndex > timelinePlugins.length) {
            console.error("invalid plugin index");
        };

        var topOffset = 0;
        for (var i = 0; i < pluginIndex; i++) {
            topOffset += timelinePlugins[i].height + audio_track_spacing;
        };

        return topOffset;
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

        // The width of the gradations container should fit the entire range of timelineLengthSeconds.
        // Plus the margin and border widths (2 each).
        var marginAndBorderSize = 2 * (flotGraphMargin + flotGraphBorder);
        var widthPixels = (timelineLengthSeconds * timeline_pixels_per_sec) + marginAndBorderSize;

        // The height of the gradations container should fit all the current tracks and plugins, with min height of 1 track.
        // Plus plugins height & spacing, margin & border heights (2 each), and label height (maybe label margin also).
        var heightPixels = (Math.max(audioModel.getAudioTracks().length, 1) * (audio_track_height + audio_track_spacing));
        heightPixels += pluginTopOffset(timelinePlugins.length) + marginAndBorderSize + flotLabelHeight;

        // Update the dimensions
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
                labelHeight: flotLabelHeight,
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
                labelMargin: flotLabelMargin,
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

    // Zoom in or out.
    // Input true to indicate zoom out (default)
    // Sends updates to zoom listeners
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

        // Tell the plugins to zoom
        for (var i = 0; i < timelinePlugins.length; i++) {
            timelinePlugins[i].zoom();
        };

        // Refreshing will update the size of the segments and wavesurfers
        // as well as the gradations.
        self.refreshView();
    };

    // Refreshes the view to reflect changes in the audio model.
    // This only changes the tracks and segments parts of the view because the other parts are
    // not dependent on model data.
    // Plugins are also refreshed.
    this.refreshView = function() {
        console.log("refresh view");

        // Refresh each of the tracks and update its position
        for (var i = 0; i < trackControllers.length; i++) {
            trackControllers[i].refreshView();

            // Offset the top of the track by the size of the other plugins and tracks before it
            var trackTopOffset = pluginTopOffset(timelinePlugins.length) + ( i * (audio_track_height + audio_track_spacing) );
            $('#'+trackControllers[i].getID()).css('top', trackTopOffset);
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

        // Iterate over the plugins and create and add their view divs to the timeline.
        for (var i = 0; i < timelinePlugins.length; i++) {
            var plugin = timelinePlugins[i];

            // Create the div and give it the ID and class
            var pluginDiv = $('<div></div>');
            pluginDiv.attr({"id": getTimelinePluginID(plugin) , "class": timelinePluginClass});

            // Add the div to the tracks container
            jqTracksContainer.append(pluginDiv);

            // Inform the plugin of its view's HTML element ID
            plugin.setViewID(getTimelinePluginID(plugin));

            // Setup the positioning and size of the div
            $('#'+getTimelinePluginID(plugin)).css('top', pluginTopOffset(i))                  
                                            .css('height', plugin.height);

            // Tell the plugin to draw the view
            plugin.draw();
        };

        // Iterate over all audio tracks and draw them
        for (var i = 0; i < trackControllers.length; i++) {

            // Draw the track and get the jquery object for that track
            console.log("Drawing track  " + i);
            var jqTrack = trackControllers[i].draw(jqTracksContainer);

            // The positioning and size is set inside refreshView()
        };

        // Show the playhead that is used to display the current position in the timeline
        drawPlayhead();

        // Refresh the view
        self.refreshView();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Timeline Plugins
    //
    // The timeline plugin is a way to add a view that appears in the audio timeline,
    // similar to how a track appears in the timeline. Once a plugin is registered,
    // it will appear in the audio timeline above the tracks. Plugins appear in the 
    // order in which they are registered.
    //
    // A plugin is a javascript object that has the following attributes:
    //
    // name  // String with the name of the plugin
    // height  // The height plugin view div in pixels (recommended height: audio_track_height)
    // setViewID(pluginDivID)  // Function that informs the plugin of the ID of its view div in the timeline
    // draw()  // Function that (re)draws the contents of the plugin view (when the audio timeline is drawn)
    // zoom()  // Function that handles what happens when the timeline is zoomed (pixel-to-second ratio changes)
    //
    // The audio controller, not the plugin, is responsible for adding the view div to the page
    // and for setting the position and size of the plugin view. The height will be set according to
    // the height in the plugin object. The width is 100% of the timeline width. The plugin is informed of the HTML element ID of
    // its view div through the setViewID() function.  The plugin draw its view whenever the audio timeline is refreshed.
    ///////////////////////////////////////////////////////////////////////////////

    this.addTimelinePlugin = function(plugin) {
        // Put the plugin in the list of plugins
        timelinePlugins.push(plugin);

        // Redraw the view
        // This will setup the plugin's view, inform the plugin of the view's ID, and tell the plugin to draw.
        self.draw();
    };

    // The plugin ID is the base plus the index of the plugin in the array
    var getTimelinePluginID = function(plugin) {

        var index = timelinePlugins.indexOf(plugin);
        if (index < 0) {
            console.error("plugin has not been added to audio controller");
        };

        return timelinePluginIDBase + index;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    // Initializes the audio controller
    // Should only be called after the document is ready

    // Set the audio model
    audioModel = audio_model;

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
    pentimento.timeController.addUpdateTimeCallback(updatePlayheadTime);
    pentimento.timeController.addBeginRecordingCallback(startRecording);
    pentimento.timeController.addEndRecordingCallback(stopRecording);
    pentimento.timeController.addBeginPlaybackCallback(startPlayback);
    pentimento.timeController.addEndPlaybackCallback(stopPlayback);

    // Button listener to start playing the audio
    var play_pause_button = $('#'+playPauseButtonID);
    play_pause_button.click(function() { 
        // Do nothing during recording
        if (pentimento.timeController.isRecording()) {
            return;
        };

        // Start or stop playback
        if (pentimento.timeController.isPlaying()) {
            pentimento.timeController.stopPlayback();  // Stop playback at the end of the audio
        } else{
            pentimento.timeController.startPlayback(pentimento.lectureController.getLectureModel().getDuration());
        };
    });

    // Button listener to record or stop the current recording
    $('#'+recordAudioButtonID).click(function() {
        // Do nothing during playback
        if (pentimento.timeController.isPlaying()) {
            return;
        };

        // Start or stop recording
        if (pentimento.timeController.isRecording()) {
            pentimento.timeController.stopRecording();
        } else{
            pentimento.timeController.startRecording();
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
