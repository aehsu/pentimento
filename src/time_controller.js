// Manages the lecture time
// Allows objects to register time update and recording status callbacks.
// Allows objects to change the current time and begin/end recording.
pentimento.timeController = new function() {
    var self = this;

    // Keeps track of the current lecture time
    var currentTime = 0;

    // When the recording began (lecture time)
    var recordingBeginTime = -1;  // Set at the beginning of every recording

    // Keeps track of the last UTC global time to calculate time passed during recording
    // -1 indicates that we are not recording
    var lastGlobalTime = -1;

    // Keep track of the interval timer for recording time updates
    var recordingUpdateInterval = null;

    // Interval after which to notify listeners of a recording time update
    var RECORDING_UPDATE_INTERVAL = 50;  // milliseconds

    // Callback functions to notify listeners.
    // Function arguments are listed in the comments. All times are in milliseconds
    var updateTimeCallbacks = [];  // When the current time changes (currentTime)
    var beginRecordingCallbacks = [];  // When a recording begins (currentTime)
    var updateRecordingTimeCallbacks = [];  // When the current time changes during a recording (currentTime)
    var endRecordingCallbacks = [];  // When a recording ends (beginTime, endTime)

    // Register callbacks
    this.addUpdateTimeCallback = function(callback) {
        updateTimeCallbacks.push(callback);
    };
    this.addBeginRecordingCallback = function(callback) {
        beginRecordingCallbacks.push(callback);
    };
    this.addUpdateRecordingTimeCallback = function(callback) {
        updateRecordingTimeCallbacks.push(callback);
    };
    this.addEndRecordingCallback = function(callback) {
        endRecordingCallbacks.push(callback);
    };

    // Get the current time (ms)
    this.getTime = function() {
        return currentTime;
    };

    // Get the time (ms) when the last recording began
    // Returns -1 if there was no previous recording
    this.getRecordingBeginTime = function() {
        return recordingBeginTime;
    };

    // Returns true if a recording is in progress
    this.isRecording = function() {
        return lastGlobalTime !== -1;
    };

    // Update the current time and notify any callbacks
    // Time cannot be updated during a recording
    this.updateTime = function(time) {

        // If a recording is in progress, the time cannot be changed
        if (self.isRecording()) {
            return;
        };

        currentTime = time;

        // Notify callbacks
        for (var i = 0; i < updateTimeCallbacks.length; i++) {
            updateTimeCallbacks[i](currentTime);
        };
    };

    // Start recording and notify any callbacks
    // Recording cannot be started if there is a recording in progress
    this.startRecording = function() {
        console.log("Begin recording");

        // If a recording is in progress, a recording cannot be started
        if (self.isRecording()) {
            return;
        };

        // Keep track of the global time to know how much time has elapsed
        lastGlobalTime = globalTime();

        // Keep track of the lecture time when recording began
        recordingBeginTime = currentTime;

        // After a set interval, update the current time and notify any listeners of the recording time update
        recordingUpdateInterval = setInterval(function() {

            // Calculate the elapsed time since the last update
            var gt = globalTime();
            var timeElapsed = gt - lastGlobalTime;
            lastGlobalTime = gt;

            // Update the time
            updateRecordingTime(currentTime + timeElapsed);

        }, RECORDING_UPDATE_INTERVAL);

        // Notify listeners
        for (var i = 0; i < beginRecordingCallbacks.length; i++) {
            beginRecordingCallbacks[i](currentTime);
        };
    }

    // Update the current time.
    // This is the same as updateTime(), except that it is used during recording.
    var updateRecordingTime = function(time) {

        // If a recording is not in progress, this method cannot be used
        if (!self.isRecording()) {
            return;
        };

        currentTime = time;

        // Notify listeners
        for (var i = 0; i < updateRecordingTimeCallbacks.length; i++) {
            updateRecordingTimeCallbacks[i](currentTime);
        };
    };
    
    // End the recording and notify any callbacks
    this.stopRecording = function() {
        console.log("End recording");

        // If a recording is not in progress, the recording cannot be stopped
        if (!self.isRecording()) {
            return;
        };

        // Clear the interval used for recording time updates
        clearInterval(recordingUpdateInterval);
        recordingUpdateInterval = null;

        // Calculate the new current time
        currentTime += (globalTime() - lastGlobalTime);

        // Reset the global time to indicate that the recording has stopped
        lastGlobalTime = -1;

        // Notify listeners
        for (var i = 0; i < endRecordingCallbacks.length; i++) {
            endRecordingCallbacks[i](recordingBeginTime, currentTime);
        };
    };
};
