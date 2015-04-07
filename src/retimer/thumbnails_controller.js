/* TODO:
    0) Updated rest of code to work again with these functions
    1) redraw all of the thumbnails each time the visuals are redrawn/edited
    2) refactor to take into account audio times/"global times"/retimer times when drawing thumbnails
*/
var ThumbnailsController = function(visuals_controller) {

    var visualsController = visuals_controller;
    var renderer = new Renderer(visualsController);
    var pixelSecondRatio = -1;
    // TODO need setter

    // Draw the thumbnails whenever the visuals in the main window are updated or changed
    // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
    // zoomFactor: how much to scale the curret zoom by.

    // calculate number of thumbnails to draw
    // setup all the canvases
    // iterate over and call generate thumbnail
    this.drawThumbnails = function(){

        var numThumbs;
        console.log("drawingThumb Zoom: " + currZoom);

        // Get the end time of the lecture, lecture duration. 
        var max_time = pentimento.lectureController.getLectureModel().getLectureDuration();

        // Calculate the amount of time for the thumbnails
        // If zoom is 1 (default) draw one thumbnail for every second (time measured in ms)
        var thumbZoom = Math.round(currZoom/zoomFactor);
        currZoom = thumbZoom;

        // Original recording (if there is no lecture duration or currently no thumbnails),
        // draw the thumbs as expected.
        // *******************probably should deal with all of this as redrawing all thumbnails...
        if($('#thumbnails_div').children().length == 0 || max_time == 0){

            // The number of thumbnails to draw.
            // Calculated by the total amount of time in the lecture divided by the amount of time per thumbnail
            numThumbs = Math.ceil(max_time/thumbZoom);

            // Reset the maximum time of the thumbnails to the current lecture duration
            $('#thumbnails_div').data('currmax', max_time);

            // Generate the thumbnail for each thumbnail in the sequence
            for(var i=0; i<numThumbs; i++){

                // Establish which number the thumbnail is
                var thumbOffset = i;

                // Calculate the minimum ad maximum times associated with visuals to display for the thumbnail
                // If it is the last thumbnail then set the maximum time to the duration of the lecture 
                var curr_min = i*thumbZoom;
                var curr_max = (i+1)*thumbZoom;
                if((i+1) == numThumbs){
                    curr_max = max_time;
                }

                // Generate the thumbnail drawing
                generateThumbnail(currZoom, thumbOffset, curr_min, curr_max);
            }
        }

        // If the final time of the recording is the same as the maximum time then visuals were added to the end
        // of the lecture and thumbnails already exist.
        else if($('#thumbnails_div').data('endrecord') == max_time){
            console.log('THUMBNAILS EXIST');

            // Find the previous maximum time (where the visuals started being added from) and reset to the 
            // new maximum time
            var prev_max = $('#thumbnails_div').data('currmax');
            $('#thumbnails_div').data('currmax', max_time);

            // Calculate the number ofthumbnails to add
            numThumbs = Math.ceil((max_time-prev_max)/thumbZoom);

            // Find the value of the last already drawn thumbnail (the offset from zero)
            // to offset the new thumbnails.
            var last_thumb = $("#thumbnails_div :last-child").attr('id');
            var last_thumb_split = last_thumb.split('_');
            var last_thumb_num = last_thumb_split[last_thumb_split.length-1];
            var curr_thumb = parseInt(last_thumb_num) + 1;

            // Generate the thumbnail for each  new thumbnail added to the sequence
            for(var i=0; i<numThumbs; i++){

                // The time will be offset by the thumbnail's value in the new squence plus the
                // number of thumbnails previously drawn.
                var thumbOffset = curr_thumb + i;

                // Calculate the minimum ad maximum times associated with visuals to display for the thumbnail
                // If it is the last thumbnail then set the maximum time to the duration of the lecture 
                var curr_min = (curr_thumb+i)*thumbZoom;
                var curr_max = (curr_thumb+i+1)*thumbZoom;
                if((i+1) == numThumbs){
                    curr_max = max_time;
                }

                // Generate the thumbnail
                generateThumbnail(currZoom, thumbOffset, curr_min, curr_max);
            }
        }

        // If the thumbnails aren't the first recording or added tothe end they are being inserted.
        // Handle that with a function to insert thumbnails
        else{
            console.log("THUMBNAILS BEING INSERTED");
            insertThumbnails(currZoom, thumbOffset, curr_min, curr_max);
        }

        // Redraw the canvas containing the constraints to match the length of the string of thumbnails.
        extendRetimingConstraintsCanvas();
    }

    // Generate the thumbnails by getting the visuals from the slides.
    // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
    // thumbOffset: the number of the thumbnail in the sequence of all of the thumbnails
    // currMin: the minimum time to be displayed by the current thumbnail
    // currMax: the maximumm time to be displayed by the current thumbnail

    // param: time, duration, thumbnailIndex
    var generateThumbnail = function(thumbOffset, curr_min, curr_max){

        // Draw the thumbnail image in the middle of the time interval represented by the thumbnail
        var thumbTime = Math.round((curr_min + curr_max)/2);

        // Get the slides for the visuals
        var slides = visualsModel.getSlidesIterator();

        // Boolean to tell if this is the first visual of the slide (to tell if a new thumbnail is created)
        var firstVisual = true;

        // Iterate through the slides in the lecture to get all of the visuals
        while(slides.hasNext()){
            var slide = slides.next();

            // Iterate through all of the visuals in the slide
            var visuals = slide.getVisualsIterator();

            while(visuals.hasNext()){

                // Get the next visual and the time that that visual is displayed
                var visual = visuals.next();
                var curr_tMin = visual.getTMin();

                // If the visual is displayed before the time displayed in the thumbnail then draw the visual on the thumbnail
                if(curr_tMin < thumbTime){

                    // Parameters associated with each visual in the thumbnail
                    // thumbOffset: number that the thumbnail is in the series
                    // firstVisual: whether or not this visual is the first one of the slide
                    // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
                    // timeMin: the minimum time of the current thumbnail
                    // timeMax: the maximum time of the current thumbnail
                    // thumbTime: the moment to be displayed on the thumbnail (half way between the min/max times)
                    var thumbParams = {'thumbOffset': thumbOffset, 'firstVisual' : firstVisual, 'currZoom' : currZoom, 'timeMin' : curr_min, 'timeMax' : curr_max, 'thumbTime' : thumbTime};
                    drawVisual(visual,slideTime,true,thumbParams);
                    // TODO: use renderer
                }

                // No longer the first visual to be drawn. Set to false.
                firstVisual = false;
            }
        }
    };


    // Register handlers for playing and pausing the visuals
    pentimento.timeController.addUpdateTimeCallback(function() {
        if (pentimento.timeController.isPlaying()) {
            drawThumbnails(1000,1);
        };
    });
    pentimento.timeController.addBeginPlaybackCallback(function() {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });
    pentimento.timeController.addEndPlaybackCallback(function() {
        $('input[data-toolname="play"]').toggleClass('hidden');
        $('input[data-toolname="pause"]').toggleClass('hidden');
    });


};