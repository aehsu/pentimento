// Controller for the DOM audio track inside the DOM track container
var AudioTrackController = function(track, audio_controller) {

    ///////////////////////////////////////////////////////////////////////////////
    // Member Variables
    ///////////////////////////////////////////////////////////////////////////////

    var audio_track = null;  // audio_track from the model
    var audioController = audioController;
    var trackID = null;  // HTML ID used to identify the track
    var trackClass = "audio_track";

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////
    
    // Audio model track is passed on input
    audio_track = track;

    // Create a new track ID of the form
    // 'track#' where '#' is a positive integer 
    trackID = 'track' + (AudioTrackController.counter++);

    ///////////////////////////////////////////////////////////////////////////////
    // Callback methods
    ///////////////////////////////////////////////////////////////////////////////

    var segmentDragging = function() {

    };

    var segmentStopDragging = function() {

    };

    ///////////////////////////////////////////////////////////////////////////////
    // Public Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Get the ID of the track
    this.getID = function() {
        return trackID;
    };

    // Draw a track
    // Return the new jQuery track
    var draw = function() {

        // Create a new track div and set it's data
        var new_track = $('<div></div>').attr({"id": trackID , "class": trackClass});
        new_track.data(audio_track);
        new_track.sortable();

        // Iterate over all segments for that track and draw the segments (inside the track)
        for (var i = 0; i < audio_track.audio_segments.length; i++) {
            var segment = new AudioSegmentController(audio_track.audio_segments[i], audioController);
            new_track.append(segment.draw());
        };

        return new_track;
    };
};

///////////////////////////////////////////////////////////////////////////////
// Static Variables
///////////////////////////////////////////////////////////////////////////////

// Counter used for the ID
AudioTrackController.counter = 0;


