/* TODO:
    0) Updated rest of code to work again with these functions
    1) redraw all of the thumbnails each time the visuals are redrawn/edited
    2) refactor to take into account audio times/"global times"/retimer times when drawing thumbnails
*/
"use strict";

var ThumbnailsController = function(visuals_controller, audio_controller, retimer_model, globalState) {

    var self = this;
    var visualsController = visuals_controller;
    var audioController = audio_controller;
    var retimerModel = retimer_model;
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

        var audioMaxTime = globalState.getLectureDuration();
        var total_width = audioController.millisecondsToPixels(audioMaxTime);
        if (total_width <= 0) {
            return;
        };

        var original_height = visualsController.getVisualsModel().getCanvasSize().height;
        var original_width = visualsController.getVisualsModel().getCanvasSize().width;
        var scale = thumbnailsHeight / original_height;
        var thumbnail_width = Math.round(scale * original_width);
        var numThumbs = Math.ceil(total_width / thumbnail_width);

        // Generate the thumbnail for each thumbnail in the sequence
        for(var thumbOffset = 0; thumbOffset < numThumbs; thumbOffset++){

            // Calculate the minimum ad maximum times associated with visuals to display for the thumbnail
            var audTMin = audioController.pixelsToMilliseconds(thumbOffset*thumbnail_width);
            var audTMax = audioController.pixelsToMilliseconds((thumbOffset+1)*thumbnail_width);
            var visuals_min = retimerModel.getVisualTime(audTMin);
            var visuals_max = retimerModel.getVisualTime(audTMax);

            // On the last iteration, reduce the thumbnail width so that it does not
            // exceed the visuals end time, set the maximum time to the duration of the lecture.
            if (thumbOffset == numThumbs - 1) {
                thumbnail_width -= (numThumbs * thumbnail_width) - total_width;
                visuals_max = retimerModel.getVisualTime(audioMaxTime);
            };

            // Generate the thumbnail drawing
            generateThumbnail(thumbOffset, visuals_min, visuals_max, thumbnail_width);
        };
    };

    // Generate a thumbnail by getting the visuals from the slides.
    // thumbOffset: the number of the thumbnail in the sequence of all of the thumbnails
    // visualsMin: the minimum time to be displayed by the current thumbnail
    // visualsMax: the maximumm time to be displayed by the current thumbnail
    var generateThumbnail = function(thumbOffset, visuals_min, visuals_max, thumbnail_width) {

        // Setup the canvas for the thumbnail
        // The size must be set using attributes, not CSS
        var canvas = $('<canvas></canvas>');
        canvas.attr('id', thumbnailIDBase+thumbOffset)
            .attr('width', thumbnail_width)
            .attr('height', thumbnailsHeight);
        $('#'+thumbnailsDivID).append(canvas);
        canvas.addClass(thumbnailClass);

        var context = canvas[0].getContext('2d');

        // Render the thumbnail on the appropriate canvas
        renderer.drawCanvas(canvas, context, visuals_min, visuals_max)
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
};
