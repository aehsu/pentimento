/* TODO:
    0) Updated rest of code to work again with these functions
    1) redraw all of the thumbnails each time the visuals are redrawn/edited
    2) refactor to take into account audio times/"global times"/retimer times when drawing thumbnails
*/

// Draw the thumbnails whenever the visuals in the main window are updated or changed
// currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
// zoomFactor: how much to scale the curret zoom by.
var drawThumbnails = function(currZoom, zoomFactor){

    var numThumbs;
    console.log("drawingThumb Zoom: " + currZoom);

    // Get the end time of the lecture, lecture duration. 
    var max_time = pentimento.lectureController.getLectureDuration();

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
var generateThumbnail = function(currZoom, thumbOffset, curr_min, curr_max){

    // Draw the thumbnail image in the middle of the time interval represented by the thumbnail
    var thumbTime = Math.round((curr_min + curr_max)/2);

    // Get the slides for the visuals
    var slides = pentimento.lecture.getSlidesIterator();
    var slideTime = pentimento.timeController.getTime();

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
            }

            // No longer the first visual to be drawn. Set to false.
            firstVisual = false;
        }
    }
}



var redrawThumbnails = function(numThumbs, thumbLength){
    // thumbLength = audio ms
    $('#thumbnails_div').empty();
    var max_time = pentimento.lectureController.getLectureDuration();
    for(var i=0; i<=numThumbs; i++){
        var thumbOffset = i;
        var curr_audio_min = i*thumbLength;
        var curr_audio_max = (i+1)*thumbLength;
        if((i+1) == numThumbs){
            curr_audio_max = max_time;
        }
        var curr_vis_min =  pentimento.lectureController.retimingController.getVisualTime(curr_audio_min);
        var curr_vis_max =  pentimento.lectureController.retimingController.getVisualTime(curr_audio_max);
        generateThumbnail(1000, thumbOffset, curr_vis_min, curr_vis_max);
    }
}

// TODO: just redraw all constraints instead of doing this
var insertThumbnails = function(currZoom, thumbOffset, curr_min, curr_max){
    var last_thumb = $("#thumbnails_div :last-child").attr('id');
    var last_thumb_split = last_thumb.split('_');
    var last_thumb_num = last_thumb_split[last_thumb_split.length-1];
    var max_kept_thumb = parseInt(last_thumb_num);
    var max_kept_thumb_time = $('#' + last_thumb).data('timemax');
    console.log("max_kept_thumb_time " + max_kept_thumb_time);
    var max_set = false;

    var insert_start = $('#thumbnails_div').data('beginrecord');

    console.log('insert_start ' + insert_start);


    $('#thumbnails_div').children().each(function () {
        console.log("canvas_id " + this.id);
        console.log("thumbTime " + $(this).data('timemax'));

        var thumb_id = this.id;
        var thumb_id_split = thumb_id.split('_');
        var thumb_num = thumb_id_split[thumb_id_split.length-1];
        var curr_num = parseInt(thumb_num);

        var thumb_end_time = $(this).data('timemax');
        if(thumb_end_time > insert_start){
            if(!max_set){
                max_kept_thumb = curr_num-1;
            }
            max_set = true
        }
        if(!max_set){
            max_kept_thumb_time = thumb_end_time
        }
        

        // if(thumb_end_time > insert_start){
        //  if(!max_set){
        //      max_kept_thumb = curr_num-1;
        //      max_kept_thumb_time = prev_max;
        //      max_set = true;
        //  }
        // }

        if(curr_num > max_kept_thumb){
            console.log("CACHINNNNNGGG");
            // console.log($(this));
            // $('#thumbnails_cache').append($(this));
            $(this).remove();
        }
    });

    // Get the end time of the lecture, lecture duration. 
    var max_time = pentimento.lectureController.getLectureDuration();

    var numThumbs = Math.ceil((max_time-max_kept_thumb_time)/currZoom);

    console.log('numThumbs: ' + numThumbs + ", max_time: " + max_time + ", thumb_max_time: " + max_kept_thumb_time + ", max_kept_thumb: " + max_kept_thumb);

    for(var i=0; i<numThumbs; i++){
        console.log("i: "+ i)
        var thumbOffset = max_kept_thumb + i;

        var curr_min = (max_kept_thumb+i)*thumbZoom;
        var curr_max = (max_kept_thumb+i+1)*thumbZoom;
        if((i+1) == numThumbs){
            curr_max = max_time;
        }
        // draw the image in the middle of the time interval represented by the thumbnail
        var thumbTime = Math.round((curr_min + curr_max)/2);
        console.log("curr_min: " + curr_min + ", curr_max: " + curr_max);
        console.log("thumbTime: " + thumbTime);

        var slides = pentimento.lecture.getSlidesIterator();
        var slideTime = pentimento.timeController.getTime();
        var firstVisual = true;
        while(slides.hasNext()){
            var slide = slides.next();
            var visuals = slide.getVisualsIterator();

            while(visuals.hasNext()){
                var visual = visuals.next();
                var curr_tMin = visual.getTMin();

                if(curr_tMin < thumbTime && curr_tMin > max_kept_thumb_time){
                    var thumbParams = {'thumbOffset': thumbOffset, 'firstVisual' : firstVisual, 'currZoom' : currZoom, 'timeMin' : curr_min, 'timeMax' : curr_max, 'thumbTime' : thumbTime };
                    drawVisual(visual,slideTime,true,thumbParams);
                }

                firstVisual = false;

            }
        }
    }
}

var scaleThumbs = function(tVisOld, tVisPrev, tVisNew, tVisNext){

    // function scaleThumbs(zoomFactor, tMin, tMax)
    // console.log("ZOOMING");

    // var currZoom = $('#thumbnails_div').data('currzoom');   

    // console.log("zoomInCurrZoom: " + currZoom);
    console.log("old: " + tVisOld);
    console.log("new: " + tVisNew);
    console.log("prev: " + tVisPrev);
    console.log("next: " + tVisNext);

    var scalePrev = (tVisOld - tVisPrev)/(tVisNew - tVisPrev);
    var scaleNext = (tVisNext - tVisOld)/(tVisNext - tVisNew);

    console.log("ScalePrev: " + scalePrev);
    console.log("scaleNext: " + scaleNext);

    var currZoom = $('#thumbnails_div').data('currzoom');
    // $('#thumbnails_div').html('');
    // drawThumbnails(currZoom, zoomFactor);
    $('#thumbnails_div').children().each(function () {
        console.log(this);
        console.log("type: " + (typeof this))
        var id = this.id;
        console.log("canvas_id " + this.id);
        console.log("canvasMinTime:" + $('#' + id).data('timemin'));
        console.log("canvasMaxTime: " + $('#' + id).data('timemax'));
        var currTMin = $('#' + id).data('timemin');
        var currTMax = $('#' + id).data('timemax');

        if(currTMin > tVisPrev && currTMax < tVisNext){
            $('#thumbnails_cache').append('<span>SCALING</span>');
        }
        else{
            var htmlStr = $('#' + id).prop('outerHTML');
            console.log("str: " + htmlStr);
            $('#thumbnails_cache').append('<span>KEEP</span>');
            $('#thumbnails_cache').append(htmlStr);
        }
        // $('#thumbnails_div').remove('#' + id);
    });
    $('#thumbnails_div').empty();
}

var updateVisuals = function(isThumbnail) {
    clear();
    var slideIter = pentimento.lecture.getSlidesIterator();
    var state = pentimento.state;
    var slideTime = pentimento.timeController.getTime();
    while(slideIter.hasNext()) {
        var slide = slideIter.next();
        if(slide==state.currentSlide) {
            var visualsIter = slide.getVisualsIterator();
            while(visualsIter.hasNext()) {
                var visual = visualsIter.next();
                //visible ON tMin due to equality, deleted ON tDeletion due to lack of equality
                if (isVisualVisible(visual, slideTime)) {
                    drawVisual(visual, slideTime, isThumbnail, {});
                }
            }
        } else {
            slideTime -= slide.getDuration();
        }
    }
    if (state.currentVisual != null)
        drawVisual(state.currentVisual, globalTime(), isThumbnail, {});
    for(var i in state.selection) {
        var visCopy = state.selection[i].getClone();
        var propsCopy = visCopy.getProperties();
        propsCopy.setWidth(propsCopy.getWidth()+1);
        propsCopy.setColor("#0000FF");
        drawVisual(visCopy, slideTime, isThumbnail,{});
    }
}

var clear = function() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

// Register handlers for playing and pausing the visuals
pentimento.timeController.addUpdateTimeCallback(function() {
    if (pentimento.timeController.isPlaying()) {
        updateVisuals(false);
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

