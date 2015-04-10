/* TODO:
    0) Updated rest of code to work again with these functions
    1) redraw all of the thumbnails each time the visuals are redrawn/edited
    2) refactor to take into account audio times/"global times"/retimer times when drawing thumbnails
*/
"use strict";

var ThumbnailsController = function(visuals_controller, audio_controller) {

    var self = this;
    var visualsController = visuals_controller;
    var audioController = audio_controller;
    var renderer = new Renderer(visualsController);


    ///////////////////////////////////////////////////////////////////////////////
    // DOM Elements
    ///////////////////////////////////////////////////////////////////////////////

    var thumbnailsDivID = null;  // Set by the audio timeline plugin function setViewID()
    var thumbnailsHeight = 100;  // height of the thumbnails and thumbnails div in pixels
    var thumbnailIDBase = 'thumbnail_';  // Base for the ID. The full ID has an index at the end (e.g. thumbnail_0)
    var thumbnailClass = 'thumbnail';  // Class attached to each of the thumbnails


    ///////////////////////////////////////////////////////////////////////////////
    // Draw Methods
    ///////////////////////////////////////////////////////////////////////////////

    // Draw the thumbnails whenever the visuals in the main window are updated or changed
    // calculate number of thumbnails to draw
    // setup all the canvases
    // iterate over and call generate thumbnail
    this.drawThumbnails = function() {

        // Clear the thumbnails div
        $('#'+thumbnailsDivID).html('');

        var max_time = pentimento.lectureController.getLectureModel().getLectureDuration();
        var total_width = audioController.millisecondsToPixels(max_time);
        console.log("totalWidth: " + total_width);
        if (total_width <= 0) {
            console.log("no thumbnails to draw");
            return;
        };

        var original_height = visualsController.getVisualsModel().getCanvasSize().height;
        var original_width = visualsController.getVisualsModel().getCanvasSize().width;
        var scale = thumbnailsHeight / original_height;
        var thumbnail_width = Math.round(scale * original_width);
        console.log("thumbnailWidth: " + thumbnail_width);

        var numThumbs = Math.ceil(total_width / thumbnail_width);
        console.log("numThumbs: " + numThumbs);

        // Generate the thumbnail for each thumbnail in the sequence
        for(var thumbOffset = 0; thumbOffset < numThumbs; thumbOffset++){

            // Calculate the minimum ad maximum times associated with visuals to display for the thumbnail
            // If it is the last thumbnail then set the maximum time to the duration of the lecture 
            // TODO: convert to audio time?? or from audio time??
            var curr_min = audioController.pixelsToMilliseconds(thumbOffset*thumbnail_width);
            var curr_max = audioController.pixelsToMilliseconds((thumbOffset+1)*thumbnail_width);
            if (thumbOffset + 1 == numThumbs) {
                curr_max = max_time;
            };

            // On the last iteration, reduce the thumbnail width so that it does not
            // exceed the visuals end time. 
            if (thumbOffset == numThumbs - 1) {
                thumbnail_width -= (numThumbs * thumbnail_width) - total_width;
            };

            // Generate the thumbnail drawing
            generateThumbnail(thumbOffset, curr_min, curr_max, thumbnail_width);
        }
    }; 

    // Generate a thumbnail by getting the visuals from the slides.
    // thumbOffset: the number of the thumbnail in the sequence of all of the thumbnails
    // currMin: the minimum time to be displayed by the current thumbnail
    // currMax: the maximumm time to be displayed by the current thumbnail
    var generateThumbnail = function(thumbOffset, curr_min, curr_max, thumbnail_width) {

        // Setup the canvas for the thumbnail
        // The size must be set using attributes, not CSS
        var canvas = $('<canvas></canvas>');
        canvas.attr('id', thumbnailIDBase+thumbOffset)
            .attr('width', thumbnail_width)
            .attr('height', thumbnailsHeight);
        canvas.addClass(thumbnailClass);
        $('#'+thumbnailsDivID).append(canvas);

        var context = canvas[0].getContext('2d');

        // Draw the thumbnail image in the middle of the time interval represented by the thumbnail
        var thumbTime = Math.round((curr_min + curr_max)/2);

        // Render the thumbnail on the appropriate canvas
        renderer.drawCanvas(canvas, context, thumbTime)
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // Creates the plugin to display on the audio timeline and registers callbacks
    // to the time controller. 
    // The thumbnails are drawn whenever the audio timeline is (re)drawn and zoomed, 
    // and they are also drawn when a recording ends.
    ///////////////////////////////////////////////////////////////////////////////

    // Adds a plugin to the audio controller so that it can display a view inside the audio timeline
    audioController.addTimelinePlugin({
        name: 'Thumbnails',
        height: thumbnailsHeight, 
        setViewID: function(pluginDivID) { thumbnailsDivID = pluginDivID; },
        draw: self.drawThumbnails, 
        zoom: self.drawThumbnails
    });

    // Register handlers for playing and pausing the visuals
    pentimento.timeController.addEndRecordingCallback(function(currentTime) {
        self.drawThumbnails();
    });
    pentimento.timeController.addBeginPlaybackCallback(function(currentTime) {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });
    pentimento.timeController.addEndPlaybackCallback(function(currentTime) {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });

};
