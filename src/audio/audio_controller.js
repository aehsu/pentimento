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
    // responsibilities for that particular track. The active track is the
    // track for recording new segments into.
    var trackControllers = [];
    var activeTrackIndex = 0;

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

    // The current timeline length is calculated when gradations refresh.
    var timelineLengthSeconds = 0;

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

    // Ticker indicating the numerical time
    var tickerID = "ticker";

    // Buttons
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

    // Add a new track
    var addTrack = function() {

        // Create a new track in the model
        var new_track = new AudioTrack();
        audioModel.addTrack(new_track);

        // Redraw
        self.draw();
    };

    // Remove a track
    var removeTrack = function() {

        // Get the index of the track
        var track_to_delete = audioModel.getAudioTracks()[activeTrackIndex];

        // Try removing the track from the model
        var result = audioModel.removeTrack(track_to_delete);
        if (!result) {
            return;
        };        

        // Set a new active track index
        activeTrackIndex = 0;

        // Redraw
        self.draw();
    };

    // Change the active track index to refer to another track
    var changeActiveTrack = function(index) {
        // Make sure the index is a valid number
        if (index < 0 || index >= audioModel.getAudioTracks().length) {
            console.error('new active track index is not valid: ' + index);
            return;
        };

        activeTrackIndex = index;
    };

    // Start recording the audio at the given track time (ms)
    // Callback method registered to the time controller
    this.startRecording = function(currentTime) {

        // This method can only be called if the time controller is recording and a recording is not currently in progress
        if ( !lectureController.isRecording() || isAudioRecording ) {
            console.error("Cannot begin recording");
            return;
        };

        isAudioRecording = true;

        // Disable editing
        disableEditUI();

        // Use recordRTC to start the actual audio recording
        recordRTC.startRecording();

        // TODO: Add an indicator in the selected track to show the duration of the recording
    };

    // End the recording (only applies if there is an ongoing recording)
    // Callback method registered to the time controller
    this.stopRecording = function(currentTime) {
        var beginTime = lectureController.getTimeController().getBeginTime();
        var endTime = currentTime;
        console.log("End audio recording (" + beginTime + ", " + endTime + ")");

        // This method can only be called if the time controller is not recording and a recording is currently in progress
        if ( lectureController.isRecording() || !isAudioRecording ) {
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
            var segment = new AudioSegment(audioURL, audio_duration, beginTime, endTime);
            console.log("new audio segment:");
            console.log(segment);
            var activeTrackController = trackControllers[activeTrackIndex];
            activeTrackController.insertSegment(segment);

            // Refresh the audio display
            self.draw();
        });
    };

    // Begin playback the audio at the given track time (ms)
    // Callback method registered to the time controller
    this.startPlayback = function(currentTime) {
        console.log("AudioController: Start playback");

        // This method can only be called if the time controller is playing and a recording is not currently in progress
        if ( !lectureController.isPlaying() || isAudioRecording ) {
            console.error("Cannot begin playback");
            return;
        };

        // Disable editing
        disableEditUI();

        // Start the track playback for each track controller
        for (var i = 0; i < trackControllers.length; i++) {
            var trackController = trackControllers[i];
            trackController.startPlayback(playheadTime);
        };
    };

    // Stop all playback activity
    this.stopPlayback = function(currentTime) {
        console.log("AudioController: Stop playback");

        // This method can only be called if the time controller is not playing and a recording is not currently in progress
        if ( lectureController.isPlaying() || isAudioRecording ) {
            console.error("Cannot end playback");
            return;
        };

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

    // Draw the container that will be used to hold the tracks
    // Return the jquery tracks container object.
    var drawTracksContainer = function() {
        var timeline = $('#' + timelineID);
        var tracksContainer = $('<div></div>');
        var gradationContainer = $('#'+gradationContainerID);
        tracksContainer.attr('id', tracksContainerID);
        timeline.append(tracksContainer);

        // The position and size is set to overlay and fit the gradation container
        // The flotPlot.offset() function only returns the global offset, so we
        // need to subtract the offset of the gradation_container
        tracksContainer.css('left', flotPlot.offset().left - gradationContainer.offset().left)
            .css('top', flotPlot.offset().top - gradationContainer.offset().top)                  
            .css('width', flotPlot.width())
            .css('height', flotPlot.height());

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

    var refreshGradations = function() {
        var gradation_container = $('#'+gradationContainerID);

        // Calculate the length of the timeline in seconds.
        // This should be twice as long as the lecture length, or at least 100 seconds.
        // During a recording, the time controller cursor also counts as length.
        var lecture_length = lectureController.getLectureModel().getLectureDuration();

        if (lectureController.isRecording()) {
            lecture_length = Math.max(lectureController.getTimeController().getTime(), lecture_length);
        }
        var old_timeline_length = timelineLengthSeconds;
        timelineLengthSeconds = Math.max(2*lecture_length/1000, minumum_timeline_seconds);

        // During a recording, if the new timeline length is less than the old timeline length,
        // then the old value of the timeline is used.
        if (lectureController.isRecording() && timelineLengthSeconds < old_timeline_length) {
            timelineLengthSeconds = old_timeline_length;
        };

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

        // Update the axis to display the length
        flotPlot.getAxes().xaxis.options.max = timelineLengthSeconds;

        // Update the data so that the ticks are drawn correctly
        var plot_data = [ [0, 0], [0, timelineLengthSeconds] ];
        flotPlot.setData(plot_data);

        // Redraw and resize flot to fit the parent container
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

        // Initialize with non-zero dummy values
        gradation_container.css('width', 4000);
        gradation_container.css('height', 4000);

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
                max: 100,  // dummy value
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
        var plot_data = [ [0, 0], [0, 100] ];

        // Use flot to draw the graduations
        flotPlot = $.plot(gradation_container, plot_data, options);

        // Updatet the size of the plot and the axes
        refreshGradations();
    };

    // Refresh the playhead position
    // There is a refresh method because the playhead position is frequently updated.
    var refreshPlayhead = function() {
        var jqPlayhead = $('#'+playheadID);
        jqPlayhead.css('left', self.millisecondsToPixels(playheadTime));
    };

    // draw the playhead for showing playback location
    var drawPlayhead = function() {
        // Create the playhead and append it to the timeline
        var playhead = $('<div></div>').attr({'id': playheadID});
        $('#'+tracksContainerID).append(playhead);  

        // The playhead overflows the tracks container
        playhead.css('top', -$('#'+tracksContainerID).position().top);

        // Set the playhead to be draggable in the x-axis within the tracksContainer
        playhead.draggable({ axis: "x",
                            containment: '#'+tracksContainerID,
                            drag: function() {
                                // Update the time controller during dragging
                                var newTrackTime = self.pixelsToMilliseconds($('#'+playheadID).position().left);
                                lectureController.getTimeController().updateTime(newTrackTime);
                            }
                        });      

        // Make sure the playhead is always on top
        playhead.css('z-index', '1000');

        // Refresh the playhead to update the position
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

        // Redraw
        self.draw();
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

        // If there are no audio tracks in the model, then error
        if (audioModel.getAudioTracks().length === 0) {
            console.error('no tracks when drawing');
        };

        // Iterate over all audio tracks and create their controllers and
        // use the controller to draw them.
        trackControllers = [];
        for (var i = 0; i < audioModel.getAudioTracks().length; i++) {
            var track = audioModel.getAudioTracks()[i];

            // Create and draw the new track controller
            var track_controller = new AudioTrackController(track, self);
            trackControllers.push(track_controller);

            // Draw the track into the parent and get the jquery object for that track.
            // Add it to the tracks container.
            var jqTrack = track_controller.draw(jqTracksContainer);

            // Offset the top of the track by the size of the other plugins and tracks before it
            var trackTopOffset = pluginTopOffset(timelinePlugins.length) + ( i * (audio_track_height + audio_track_spacing) );
            $('#'+trackControllers[i].getID()).css('top', trackTopOffset);

        };

        // Show the playhead that is used to display the current position in the timeline
        drawPlayhead();

        // Update the number of tracks in the track selector by appending the options
        var trackSelect = $('#'+trackSelectID);
        trackSelect.html('');
        for (var i = 0; i < trackControllers.length; i++) {
            var option = $('<option value="'+(i+1)+'">'+(i+1)+'</option>');
            trackSelect.append(option);
        };

        // Select the active track to be selected.
        trackSelect.val(activeTrackIndex + 1);
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Time and timeline methods
    ///////////////////////////////////////////////////////////////////////////////

    // Update the current time (ms) of the audio timeline (the time indicated by the playhead)
    // Callback method
    var updatePlayheadTime = function(currentTime) {
        var audio_timeline = $('#'+timelineID);

        // Check the time for valid bounds
        if (currentTime < 0) {
            console.error("Invalid playhead time: " + currentTime);
            return;
        };

        // Update the value of the playhead
        playheadTime = currentTime;

        // Refresh the playhead position
        refreshPlayhead();

        // Check to see if the playhead is in view and not hidden due to the scrolling.
        // Calculate the visible region of the tracks container in pixels.
        var scroll_offset_x = audio_timeline.scrollLeft();
        var timeline_width = audio_timeline.width();
        var min_vis_x = Math.max(scroll_offset_x - (flotGraphMargin + flotGraphBorder), 0);
        var max_vis_x = min_vis_x + timeline_width - (flotGraphMargin + flotGraphBorder);

        // Scroll the timeline to make sure the playhead is always in view.
        // This is needed during calls to this function during a recording or playback timing.
        // Change the scroll so that the playhead starts at the left
        var playhead_x = $('#'+playheadID).position().left;
        if (playhead_x < min_vis_x || playhead_x > max_vis_x) {
            audio_timeline.scrollLeft(playhead_x + (flotGraphMargin + flotGraphBorder));
        };

        // Update the timeline length if the current time is greater than the time.
        // The length is updated by a factor of two, and the gradations are redrawn.
        if (playheadTime/1000 + 1 >= timelineLengthSeconds) {
            timelineLengthSeconds *= 2;
            refreshGradations();
        }

        // Update the ticker time as well
        updateTicker(currentTime);
    };

    // Updates the ticker display indicating the current time as a string
    var updateTicker = function(time) {

        // Calculate the values for minutes, seconds, and milliseconds
        var min = Math.floor(time/60000);
        time -= min*60000;
        var sec = Math.floor(time/1000);
        time -= sec*1000;
        var ms = time % 1000; //same as subtracting.

        // Get the string representations of those values
        if(min==0) {
            min = '00';
        } else if(min<10){
            min = '0'+min;
        }
        if(sec==0){
            sec = '00';
        } else if(sec<10) {
            sec = '0'+sec;
        }
        if(ms==0) {
            ms = '000';
        } else if(ms<10) {
            ms = '00'+ms;
        } else if(ms<100) {
            ms = '0'+ms;
        }

        // Update the display
        $('#'+tickerID).val(min + ':' + sec + '.' + ms);
    };

    // When the timeline is clicked, update the playhead time to the clicked position.
    var timelineClicked = function(event) {
        var timeline = $('#'+timelineID);
        var tracksContainer = $('#'+tracksContainerID);

        // Clicking to update time is not allowed during a timing
        if (lectureController.getTimeController().isTiming()) {
            return;
        }

        // Get the position of the click within the audio timeline
        var clickX = event.pageX - timeline.offset().left;
        var clickY = event.pageY - timeline.offset().top;

        // Calculate the position relative to the tracks container
        // The position is restricted to the bounds of the tracks container
        var x = clickX - tracksContainer.position().left;
        var y = clickY - tracksContainer.position().top;
        x = Math.max(x, 0);
        x = Math.min(x, tracksContainer.width());
        y = Math.max(y, 0);
        y = Math.min(y, tracksContainer.height());

        // The click position must be above 100px
        // TODO: find a better system to prevent click interference between segments and other timeline
        if (y > 100) {
            return;
        };

        // Use the position to calculate and update the time that is represented by the click
        var time = self.pixelsToMilliseconds(x);
        lectureController.getTimeController().updateTime(time);
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
            console.error("The following error occured: " + err);
        }
    );

    // Register callbacks with the time controller
    lectureController.getTimeController().addUpdateTimeCallback(updatePlayheadTime);

    // Mousedown listener for audio timeline
    $('#'+timelineID).click(timelineClicked);

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
    insertTrackButton.click(addTrack);
    var deleteTrackButton = $('#'+deleteTrackButtonID);
    deleteTrackButton.click(removeTrack);

    // Selected the active track
    var trackSelect = $('#'+trackSelectID);
    trackSelect.change(function() {
        var newActiveTrackIndex = (parseInt(trackSelect.val()) - 1);
        console.log("new active track index: " + newActiveTrackIndex);
        changeActiveTrack(newActiveTrackIndex);
    });

    // Draw the view
    self.draw();
};
