"use strict";

var RecordingController = function(visualsController, audioController, retimerController, toolsController, timeController, undoManager) {
    var self = {};

    var isRecording = false;
    var isRecordingVisuals = false;
    var isRecordingAudio = false;

    // Returns true if a recording is in progress
    self.isRecording = function() {
        return isRecording;
    };

    // Start recording and notify other controllers
    // Returns true and executes callback if it succeeds
    self.startRecording = function(shouldRecordVisuals, shouldRecordAudio, callback) {

        // Start the timing and exit if it fails
        if (!timeController.startTiming()) {
            return false;
        };

        isRecording = true;

        // Start the undo hierarchy so that an undo after recording ends will undo the entire recording
        undoManager.beginGrouping();

        var beginTime = timeController.getBeginTime();

        // On undo, revert to the begin time
        undoManager.registerUndoAction(self, changeTime, [beginTime]);

        // Notify controllers depending on the recording types 
        if (shouldRecordVisuals) {  // visuals
            visualsController.startRecording(beginTime);
            isRecordingVisuals = true;
        };
        if (shouldRecordAudio) {  // audio
            audioController.startRecording(beginTime);
            isRecordingAudio = true;
        };
        retimerController.beginRecording(beginTime);

        // Signal the tools controller
        toolsController.startRecording();

        // Execute the callback
        callback();
        return true;
    };

    // Stop recording and notify other controllers
    // Returns true and executes callback if it succeeds
    self.stopRecording = function(callback) {

        // Only stop if we are currently recording
        if (!isRecording) {
            return false;
        };

        // Stop the timing and exit if it fails
        if (!timeController.stopTiming()) {
            return false;
        };

        isRecording = false;

        var endTime = timeController.getEndTime();

        // Notify controllers depending on the recording types 
        if (isRecordingVisuals) {  // visuals
            visualsController.stopRecording(endTime);
        };
        if (isRecordingAudio) {  // audio
            audioController.stopRecording(endTime);
        };
        retimerController.endRecording(endTime);

        // Signal the tools controller
        toolsController.stopRecording();

        // End the undo hierarchy so that an undo will undo the entire recording
        undoManager.endGrouping();

        // Execute the callback
        callback();
        return true;
    };

    // When undoing or redoing a recording, the time should also revert back to 
    // the previous time. This function helps achieve that by wrapping around
    // a call to the time controller and the undo manager.
    var changeTime = function(time) {

        // Create an undo call to revert to the previous time
        undoManager.registerUndoAction(self, changeTime, [timeController.getTime()]);

        // Update the time
        timeController.updateTime(time);
    };

    return self;
}
