//The convention is to include the duration for which slide you're on.
//For example, slides have these durations: [10, 10, 10, 10].
//Times [1-10] are for slide 0, [11-20] are for slide 1, [21-30] are for slide 2, [31-40] are for slide 3.
//Time 0 is treated special.
"use strict";

var LectureController = function() {
    var self = this;
    var lectureModel = null;
    var visualsController = null;;
    var audioController = null;
    var retimingController = null;

    var RecordingTypes = {
        VideoOnly: "VideoOnly",
        AudioOnly: "AudioOnly",
        AudioVideo: "AudioVideo"
    };

    this.recordingType = null;
    
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

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // The lecture controller can be initialized from scratch or from a saved file.
    /////////////////////////////////////////////////////////////////////////////// 

    this.init = function() {
        // Create the lecture model, which initializes visuals, audio, and retimer models
        lectureModel = new LectureModel();
        lectureModel.init();

        // Initialize the controllers with their respective models
        visualsController = new VisualsController(lectureModel.getVisualsModel());
        audioController = new AudioController(lectureModel.getAudioModel());

        // Setup UI elements and state
        setupUI();
    };

    this.initFromFile = function() {
        // TODO

        // Setup UI elements and state
        setupUI();
    };

    var setupUI = function() {

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

};

///////////////////////////////////////////////////////////////////////////////
// Main: The single entry point for the entire application
///////////////////////////////////////////////////////////////////////////////

// Create the global pentimento object
var pentimento = {};

// Objects and controllers should only be created after the document is ready
$(document).ready(function() {

    pentimento.DEBUG = true;


    // Create the time controller, which is responsible for handling the current lecture time
    pentimento.timeController = new TimeController();

    // Create undo manager
    // var um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.SubSlideGroup, ActionGroups.VisualGroup, ActionGroups.EditGroup]);

    // Create and initialize the lecture controller
    pentimento.lectureController = new LectureController();
    pentimento.lectureController.init();

    $(window).on('mousedown', mouseDownHandler);
    $(window).on('mouseup', mouseUpHandler);
    $(window).on('keydown', keyDownHandler);
    $(window).on('keyup', keyUpHandler);
    // $(window).on('click', undoListener);
    // $(window).on('click', redoListener);

    pentimento.timeSliderController = new TimeSliderController();

    // Retimer stuff that needs to be moved into the retimer controller
    // var constraint_num = 0;
    $('#sync').click(function(){
        console.log("clicked!");
        // updateRetimerView();
        var constraint_num = pentimento.lecture.getConstraints().length;
        drawConstraint(constraint_num);
        // constraint_num += 1;
    });
    // $('#thumb_zoom_in').click(function(){
    //  var endTime = window.opener.pentimento.lectureController.getLectureDuration();
    //  scaleThumb(2, 0, endTime);
    // })

    // $('#thumb_zoom_out').click(function(){
    //  var endTime = window.opener.pentimento.lectureController.getLectureDuration();
    //  scaleThumb(0.5, 0, endTime);
    // })
    // End retimer stuff
});


