// All times mentiond are in 'audio time' unless otherwise specified.
"use strict";
var LectureController = function() {
    var self = this;

    this.DEBUG = true;

    var lectureModel = new LectureModel();
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
    var undoButtonID = 'undo';
    var redoButtonID = 'redo';
    var undoDisabledButtonID = 'undo_inactive';
    var redoDisabledButtonID = 'redo_inactive';
    var saveButtonID = 'save';
    var fileOpenerID = 'file-opener';
    var recordingAudioCheckboxID = 'audio_checkbox';
    var recordingVisualsCheckboxID = 'visuals_checkbox';

    //////////////////////////////////////////////////////////////////ac/////////////
    // Initialization
    //
    // The lecture controller can be initialized from scratch or from a saved file.
    /////////////////////////////////////////////////////////////////////////////// 

    this.init = function() {

         // Create the time controller, which is responsible for handling the current lecture time (also known as audio time)
        timeController = new TimeController();

        // Reset the undo manager and register the change listener to update buttons.
        // onchange is called anytime an undo action is registered or performed.
        
        // undoManager.clearUndo();
        // undoManager.clearRedo();

        undoManager.addListener('actionDone', updateButtons);
        undoManager.addListener('operationDone', updateButtons);

        // Initialize the controllers with their respective models.
        // These controllers might register for time controller or undo manager callbacks, so they should be initialized
        // after initializing the time controller and undo manager.
        visualsController = new VisualsController(lectureModel.getVisualsModel(), lectureModel.getRetimerModel());
        audioController = new AudioController(lectureModel.getAudioModel());
        retimerController = new RetimerController(lectureModel.getRetimerModel(), visualsController, audioController);

        // Setup input
        loadInputHandlers();

        // Update the state of the buttons
        updateButtons();
    };

    // Saves the lecture to a zip file
    var save = function() {

        // Convert the JSON form of the model into a blob
        var save_string = JSON.stringify(lectureModel.saveToJSON());
        var json_blob = new Blob([save_string], {type: "application/json"});
        var json_url = URL.createObjectURL(json_blob);
        console.log(json_blob);

        // Get all of the blobs from the audio model (iterate over segments)
        var audio_urls = lectureModel.getAudioModel().getBlobURLs();
        var audio_blobs = [];
        for (var i = 0; i < audio_urls.length; i++) {
            var xhr = new XMLHttpRequest();
            // xhr.onprogress = calculateAndUpdateProgress;
            xhr.open('GET', audio_urls[i], true);
            xhr.responseType = "blob";
            // When the blob is finished loading, increment the count and add the blob.
            // After the last one has been loaded, download the zip
            xhr.onload = function () {
                var blob = xhr.response;
                console.log(blob);

                audio_blobs.push(blob);

                if (audio_blobs.length === audio_urls.length) {
                    // Download all the blobs in a zip
                    downloadZip(json_blob, audio_blobs, []);;
                };
            };
            xhr.send(null);
        };

        // NOTE: downloadZip() is called after the last audio blob finishes loadings.
        // TODO: this needs to be modified to do this after downloading image blobs

        // Returns a blob from the URL
        // var blobFromURL = function(blob_url) {

        // };
    };

    // Takes in blobs and and create and save a zip to disk
    // Helper method for save()
    var downloadZip = function(json_blob, audio_blobs, image_blobs) {
        // Initialize the zip with a folder
        var zip = new JSZip();
        var audio_folder = zip.folder("audio");
        var image_folder = zip.folder("img");

        // After the total number of blobs have been added, 
        // then the zip will be downloaded
        var zip_blob_count = 0;
        var zip_blob_total = 1+ audio_blobs.length + image_blobs.length;

        // Function for adding a blob to the zip.
        // The zip folder can be the zip itself or just one of the folders.
        var addBlobToZip = function(zip_folder, file_name, blob) {

            // Read the blob data as base64 binary.
            // The onload() function is called after the data is loaded.
            var reader = new FileReader();
            reader.onload = function() {
                console.log(file_name);
                var base64_data =  reader.result.split(',')[1];
                
                // Add the data to the zip when done
                zip_folder.file(file_name, base64_data, {base64: true});

                // Increment the count
                zip_blob_count++;

                // If all files are done, then save the zip to disk
                if (zip_blob_count === zip_blob_total) {
                    saveZipToDisk(zip);
                };
            };
            reader.readAsDataURL(blob);
        };

        // Download the zip after it has been fully prepared.
        var saveZipToDisk = function() {
            // Create the zip
            var content = zip.generate({type:"blob"});

            // use FileSaver.js to save
            saveAs(content, "pentimento.zip");
        };

        // Add the model JSON blob
        addBlobToZip(zip, "model.json", json_blob);

        // Iterate over the audio blobs and add them to the zip.
        for (var i = 0; i < audio_blobs.length; i++) {
            addBlobToZip(audio_folder, i+".wav", audio_blobs[i]);
        };

        // Iterate over the image blobs and add them to the zip.
        for (var i = 0; i < image_blobs.length; i++) {
            // TODO: find some way to get the type of the image for the file extension
            addBlobToZip(image_folder, i+".png", image_blobs[i]);
        };

        // NOTE: saveZipToDisk() is called after the last addBlobToZip() finishes.
    };

    // Callback for lecture loading button
    var load = function() {
        var files = this.files;

        // Only one file should be selected
        if (files.length !== 1) {
            console.error('Only one file can be opened at a time');
        };

        var file = files[0];
        console.log("Filename: " + file.name);
        console.log("Type: " + file.type);
        console.log("Size: " + file.size + " bytes");

        // Use a file reader to read the zip file as a binary string,
        // and load the information into a JSZip object so that it can be loaded into the lecture.
        var reader = new FileReader();
        reader.onload = function(){
            var data = reader.result;
            var new_zip = new JSZip();
            new_zip.load(data);
            openFile(new_zip);
        }
        reader.readAsBinaryString(file);
    };

    // Loads the lecture from a JSZip object
    var openFile = function(jszip) {

        // Parse the model.json text file into a JSON object
        var json_model_object = JSON.parse(jszip.file('model.json').asText());
        console.log(jszip.file('model.json').asText());

        // Convert the audio files into audio blobs, and then get the URLs for the blobs.
        // The order of the URLs must be the same as the order indicated in the file names.
        // Start with filenames starting at 0.wav and count up until no file is found.
        var audio_folder = jszip.folder('audio');
        var audio_blob_urls = [];
        var i = 0;
        while (true) {
            // NOTE: the type of this is not the standard 'File'
            var audio_file = audio_folder.file(i+'.wav');

            // If the audio file is null, that means there are no more files to process
            if (!audio_file) {
                break;
            };

            // Turn the audio file into a blob
            var audio_blob = new Blob([audio_file.asArrayBuffer()], {type: 'audio/wav'});
            console.log(audio_blob);

            // Get the URL for the audio blob and add it to the array
            audio_blob_urls.push(URL.createObjectURL(audio_blob));

            // Increment the index for the next audio clip filename
            ++i;
        };

        console.log(audio_blob_urls);

        // For all the segments, replace the index in the segment's audio clip with the URL for the loaded audio blob
        var tracks = json_model_object['audio_model']['audio_tracks'];
        for (var i = 0; i < tracks.length; i++) {
            for (var j = 0; j < tracks[i]['audio_segments'].length; j++) {
                var segment = tracks[i]['audio_segments'][j];
                segment['audio_clip'] = audio_blob_urls[segment['audio_clip']];
            };
        };

        // Load the models
        lectureModel.loadFromJSON(json_model_object);

        // Initialize the controller with the new model
        self.init();
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

        // Start the undo hierarchy so that an undo after recording ends will undo the entire recording
        // undoManager.startHierarchy();

        var beginTime = timeController.getBeginTime();

        // On undo, revert to the begin time
        undoManager.add(function(){
            changeTime(beginTime);
        });

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

        // End the undo hierarchy so that an undo will undo the entire recording
        // undoManager.endGrouping();

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

    // Redraw the views of all of the controllers
    var draw = function() {
        visualsController.drawVisuals();
        audioController.draw();
        retimerController.redrawConstraints();

        // updateButtons() is already called because it is regisetered to the onchange for the undo manager,
        // so there is no need to call it in draw().
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Undo Manager
    //
    // Callbacks for the undo manager buttons
    ///////////////////////////////////////////////////////////////////////////////

    var undo = function() {
        console.log('undo')
        undoManager.undo();
        draw();
    };

    var redo = function() {
        console.log('redo')
        undoManager.redo();
        draw();
    };

    // When undoing or redoing a recording, the time should also revert back to 
    // the previous time. This function helps achieve that by wrapping around
    // a call to the time controller and the undo manager.
    var changeTime = function(time) {
        // Create an undo call to revert to the previous time
	var lastTime = timeController.getTime();
        undoManager.add(function(){
            changeTime(lastTime)
        });

        // Update the time
        timeController.updateTime(time);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Input Handlers and Tools
    //
    // Button callbacks and general mouse and keyboard handlers for the window and lecture tools
    ///////////////////////////////////////////////////////////////////////////////

    // Loads input handlers for the lecture tools and the window
    var loadInputHandlers = function() {
        $(window).on('mousedown', mouseDownHandler);
        $(window).on('mouseup', mouseUpHandler);
        $(window).on('keydown', keyDownHandler);
        $(window).on('keyup', keyUpHandler);

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

        // Start recording button handler
        $('#'+startRecordButtonID).click(self.startRecording);

        // Stop recording button handler
        $('#'+stopRecordButtonID).click(self.stopRecording);

        // Start playback button handler
        $('#'+startPlaybackButtonID).click(self.startPlayback);

        // Stop playback button handler
        $('#'+stopPlaybackButtonID).click(self.stopPlayback);

        // Undo button handler
        $('#'+undoButtonID).click(undo);

        // Redo button handler
        $('#'+redoButtonID).click(redo);

        // Save button handler
        $('#'+saveButtonID).click(save);

        // Open button handler
        $('#'+fileOpenerID).change(load);
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

        // Enable or disable the undo/redo buttons
        if (undoManager.canUndo() !== false) {
            $('#'+undoButtonID).removeClass(hiddenClass);
            $('#'+undoDisabledButtonID).addClass(hiddenClass);
        } else {
            $('#'+undoButtonID).addClass(hiddenClass);
            $('#'+undoDisabledButtonID).removeClass(hiddenClass);
        };
        if (undoManager.canRedo() !== false) {
            $('#'+redoButtonID).removeClass(hiddenClass);
            $('#'+redoDisabledButtonID).addClass(hiddenClass);
        } else {
            $('#'+redoButtonID).addClass(hiddenClass);
            $('#'+redoDisabledButtonID).removeClass(hiddenClass);
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

// Define the global lecture controller and undo manager objects
var lectureController;
var undoManager;

// Objects and controllers should only be created after the document is ready
$(document).ready(function() {

    // Create the undo manager
    // undoManager = new UndoManager();
    undoManager = getUndoManager([], true);

    // Create and initialize the lecture controller
    lectureController = new LectureController();
    lectureController.init();
});
