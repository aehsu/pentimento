// All times mentiond are in 'audio time' unless otherwise specified.
"use strict";
var LectureController = function() {
    var self = this;

    this.DEBUG = true;

    var lectureModel = null;
    var timeController = null;
    var visualsController = null;
    var audioController = null;
    var retimerController = null;
    
    // State for pen parameters
    this.pressure = false;
    this.pressureColor = false;
    this.pressureWidth = false;

    // State for mouse and keyboard buttons
    this.leftMouseButton = false;
    this.middleMouseButton = false;
    this.rightMouseButton = false;
    this.ctrlKey = false;
    this.shiftKey = false;
    this.altKey = false;
    this.keyboardShortcuts = false;

    // During playback, there is a timer that ends the timing at the specified end time
    var playbackEndTimeout = null;  // null indicates that it is not playing back
    var playbackEndTime = -1;  // the lecture time when the timer will stop the playback

    ///////////////////////////////////////////////////////////////////////////////
    // DOM elements
    ///////////////////////////////////////////////////////////////////////////////

    var hiddenClass = 'hidden';

    var startRecordButtonID = 'startRecord'
    var stopRecordButtonID = 'stopRecord';
    var startPlaybackButtonID = 'startPlayback';
    var stopPlaybackButtonID = 'stopPlayback';
    var saveButtonID = 'save';

    var recordingAudioCheckboxID = 'audio_checkbox';
    var recordingVisualsCheckboxID = 'visuals_checkbox';

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // The lecture controller can be initialized from scratch or from a saved file.
    /////////////////////////////////////////////////////////////////////////////// 

    this.init = function() {
        // Create the lecture model, which initializes visuals, audio, and retimer models
        lectureModel = new LectureModel();
        lectureModel.init();

        // Create the time controller, which is responsible for handling the current lecture time (also known as audio time)
        timeController = new TimeController();

        // Initialize the controllers with their respective models
        visualsController = new VisualsController(lectureModel.getVisualsModel(), lectureModel.getRetimerModel());
        audioController = new AudioController(lectureModel.getAudioModel());
        retimerController = new RetimerController(lectureModel.getRetimerModel(), visualsController, audioController);

        // Setup UI elements and state
        setupUI();
    };

    this.initFromFile = function() {
        // TODO

        // Setup UI elements and state
        setupUI();
    };

    var setupUI = function() {

        loadInputHandlers();

        if (ie10TabletPointer()) {
            console.log('Pointer Enabled Device');
            self.pressure = true;
            self.pressureColor = true;
            self.pressureWidth = true;
        } else {
            console.log('Pointer Disabled Device');
            self.pressure = false;
            self.pressureColor = false;
            self.pressureWidth = false;
        };

        // Start recording
        $('#'+startRecordButtonID).click(self.startRecording);

        // Stop recording
        $('#'+stopRecordButtonID).click(self.stopRecording);

        // Start playback
        $('#'+startPlaybackButtonID).click(self.startPlayback);

        // Stop playback
        $('#'+stopPlaybackButtonID).click(self.stopPlayback);

        // Save
        $('#'+saveButtonID).click(self.save);

        // Update the state of the buttons
        updateButtons();
    };

    // Updates the buttons to reflect the current state of recording or playback
    var updateButtons = function() {

        // Hide/unhide the record start/stop buttons
        if (self.isRecording()) {
            $('#'+startRecordButtonID).addClass(hiddenClass);
            $('#'+stopRecordButtonID).removeClass(hiddenClass);
        } else {
            $('#'+startRecordButtonID).removeClass(hiddenClass);
            $('#'+stopRecordButtonID).addClass(hiddenClass);
        };
        if (self.isPlaying()) {
            $('#'+startPlaybackButtonID).addClass(hiddenClass);
            $('#'+stopPlaybackButtonID).removeClass(hiddenClass);
        } else {
            $('#'+startPlaybackButtonID).removeClass(hiddenClass);
            $('#'+stopPlaybackButtonID).addClass(hiddenClass);
        };

        // Hide/unhide the playback start/stop buttons
    };

    // Returns true if this Internet Explorer 10 or greater, running on a device
    // with msPointer events enabled (like the ms surface pro)
    var ie10TabletPointer = function() {
        var ie10 = /MSIE (\d+)/.exec(navigator.userAgent);

        if (ie10 != null) {
            var version = parseInt(ie10[1]);
            if (version >= 10) { ie10 = true; }
            else { ie10 = false; }
        } else { ie10 = false; }

        var pointer = navigator.msPointerEnabled ? true : false;
        if (ie10 && pointer) { return true; }
        else { return false; }
    };

    this.saveToFile = function() {
        // TODO
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Getters
    //
    // Retrieve some of the lecture controller instance variables
    ///////////////////////////////////////////////////////////////////////////////

    this.getLectureModel = function() {
        return lectureModel;
    };

    // Note: Any other object getting the time controller should not use it to start
    // or stop the timing.
    this.getTimeController = function() {
        return timeController;
    };

    // Returns boolean indicating whether recording type includes audio
    this.recordingTypeIsAudio = function() {
        return $('#'+recordingAudioCheckboxID).prop('checked');
    };

    // Retruns boolean indicating whether recording type includes visuals
    this.recordingTypeIsVisuals = function() {
        return $('#'+recordingVisualsCheckboxID).prop('checked');
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Recording and playback
    //
    // Uses a TimeController to manage the timing for recording and playback.
    // When starting or stopping, these methods will call the respective start/stop
    // methods in the visuals/retimer/audio controllers to signal the event.
    ///////////////////////////////////////////////////////////////////////////////

    // Returns true if a recording is in progress
    this.isRecording = function() {
        return (timeController.isTiming() && !self.isPlaying());
    };

    // Returns true if a playback is in progress
    this.isPlaying = function() {
        return (timeController.isTiming() && playbackEndTime >= 0 && playbackEndTimeout);
    };

    // Start recording and notify other controllers
    // Returns true if it succeeds
    this.startRecording = function() {

        // Start the timing and exit if it fails
        if (!timeController.startTiming()) {
            return false;
        };

        var beginTime = timeController.getBeginTime();

        // Notify controllers depending on the recording types 
        if (self.recordingTypeIsVisuals()) {  // visuals
            visualsController.startRecording(beginTime);
        };
        if (self.recordingTypeIsAudio()) {  // audio
            audioController.startRecording(beginTime);
        };
        retimerController.beginRecording(beginTime);

        // Update the UI buttons
        updateButtons();

        return true;
    };

    // Stop recording and notify other controllers
    // Returns true if it succeeds
    this.stopRecording = function() {

        // Only stop if we are currently recording
        if (!self.isRecording()) {
            return false;
        };

        // Stop the timing and exit if it fails
        if (!timeController.stopTiming()) {
            return false;
        };

        var endTime = timeController.getEndTime();

        // Notify controllers depending on the recording types 
        if (self.recordingTypeIsVisuals()) {  // visuals
            visualsController.stopRecording(endTime);
        };
        if (self.recordingTypeIsAudio()) {  // audio
            audioController.stopRecording(endTime);
        };
        retimerController.endRecording(endTime);

        // Update the UI buttons
        updateButtons();

        return true;
    };

    // Start playback and and notify other controllers
    // Returns true if it succeeds
    this.startPlayback = function() {

        // TODO Optional end_time (lecture time) indicates when the playback will auto end
        var end_time = lectureModel.getLectureDuration();
        // Check the validity of the end time. It must be after the current time.
        if ( typeof end_time !== "number" || Math.round(end_time) <= timeController.getTime() ) {
            return false;
        };

        // Start the timing and exit if it fails
        if (!timeController.startTiming()) {
            return false;
        };

        var beginTime = timeController.getBeginTime();

        // Keep track of when the playback is supposed to end
        playbackEndTime = Math.round(end_time);
        console.log('playback begin time: ' + beginTime);
        console.log('playback end time: ' + playbackEndTime);

        // Set the timeout to stop the recording
        playbackEndTimeout = setTimeout(self.stopPlayback, playbackEndTime - beginTime);

        // Notify controllers
        visualsController.startPlayback(beginTime);
        audioController.startPlayback(beginTime);

        // Update the UI buttons
        updateButtons();

        return true;
    };

    // Stop playback and notify other controllers
    // Returns true if it succeeds
    this.stopPlayback = function() {

        // Only stop if we are currently playing
        if (!self.isPlaying()) {
            return false;
        };

        // Stop the timing and exit if it fails
        if (!timeController.stopTiming()) {
            return false;
        };

        // Clear the timout and reset the variables
        clearTimeout(playbackEndTimeout);  // This is not necessary if playback was ended manually
        playbackEndTimeout = null;
        playbackEndTime = -1;

        var endTime = timeController.getEndTime();

        // Notify controllers
        visualsController.stopPlayback(endTime);
        audioController.stopPlayback(endTime);

        // Update the UI buttons
        updateButtons();

        return true;
    };

    // Get the lecture time when the playback is supposed to end
    // Returns -1 if not currently in a playback
    this.getPlaybackEndTime = function() {
        return endTime;
    };


    this.save = function(){
        // TODO get all the json stuff and create a file
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Event Handlers and Tools
    //
    // Button callbacks and general mouse and keyboard handlers for the entire lecture
    ///////////////////////////////////////////////////////////////////////////////

    // Loads input handlers on the entire window
    var loadInputHandlers = function() {
        $(window).on('mousedown', mouseDownHandler);
        $(window).on('mouseup', mouseUpHandler);
        $(window).on('keydown', keyDownHandler);
        $(window).on('keyup', keyUpHandler);
    };

    var mouseDownHandler = function(evt) {
        switch(evt.which) {
            case 1:
                self.leftMouseButton = true;
                break;
            case 2:
                self.middleMouseButton = true;
                break;
            case 3:
                self.rightMouseButton = true;
                break;
            default:
                console.log("unique mouse hardware?", evt);
                break;
        }
    }

    var mouseUpHandler = function(evt) {
        self.leftMouseButton = false;
        self.middleMouseButton = false;
        self.rightMouseButton = false;
    };

    var keyDownHandler = function(evt) {
        if(evt.ctrlKey) {
            self.ctrlKey = true;
        } else if(evt.shiftKey) {
            self.shiftKey = true;
        } else if(evt.altKey) {
            self.altKey = true;
        }
    };

    var keyUpHandler = function(evt) {
        if(evt.which == 17) { //ctrl key
            self.ctrlKey = false;
        } else if(evt.which == 16) { //shift key
            self.shiftKey = false;
        } else if(evt.which == 18) {
            self.altKey = false;
        }
    };

};


///////////////////////////////////////////////////////////////////////////////
// Main: The single entry point for the entire application
///////////////////////////////////////////////////////////////////////////////

// Define the global lecture controller object
var lectureController;

// Objects and controllers should only be created after the document is ready
$(document).ready(function() {

    // Create undo manager
    // var um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.SubSlideGroup, ActionGroups.VisualGroup, ActionGroups.EditGroup]);

    // Create and initialize the lecture controller
    lectureController = new LectureController();
    lectureController.init();
});
