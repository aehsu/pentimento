// retimer.constraintsHandler = function(){

// }


function drawVisual(visual, tVisual, isThumbnail, thumbParams) {
    tVisual = tVisual || pentimento.state.videoCursor;
    //TODO SUPPORT FOR TRANSFORMS
    switch(visual.getType()) {
        case VisualTypes.basic:
            console.log("someone actually made a basic type?!",visual);
            break;
        case VisualTypes.stroke:
            renderCalligraphicStroke(visual, tVisual, isThumbnail, thumbParams);
            break;
        case VisualTypes.dot:
            break;
        case VisualTypes.img:
            break;
    }
}

function drawVisuals(visuals, isThumbnail) {
    for (var i in visuals) {
        drawVisual(visuals[i], isThumbnail, {});
    }
}

function renderCalligraphicStroke(visual, tVisual, isThumbnail, thumbParams) {
    var calligraphic_path = [];
    var vertsIter = visual.getVerticesIterator();
    var prev, curr;
    var old_angle;
    var old_direction;

    // Parameters for thumbnails
    var origional_width;
    var original_height;
    var scale;
    var width_offset;

    // If the stroke is being drawn as a thumbnail
    if(isThumbnail){
        // Get the size of the main visuals canvas where the visuals were drawn
        original_width = window.opener.pentimento.state.context.canvas.width;
        original_height = window.opener.pentimento.state.context.canvas.height;

        // Calculate the scale of the size of the thumbnail relative to the main canvas size
        // (height of the thumbnails display is set, so use that for calculation, but thumbnails can be any width)
        scale = $('#thumbnails_div').height()/original_height;
        width_offset = scale * original_width;

        // Parameters associated with each visual in the thumbnail
        // thumbOffset: number that the thumbnail is in the series
        // firstVisual: whether or not this visual is the first one of the slide
        // currZoom: current amount of time for the thumbnail measured in ms (currZoom = 1000 means one thumbnail per second)
        // timeMin: the minimum time of the current thumbnail
        // timeMax: the maximum time of the current thumbnail
        // thumbTime: the moment to be displayed on the thumbnail (half way between the min/max times)
        var thumbOffset = thumbParams.thumbOffset;
        var firstVisual = thumbParams.firstVisual;
        var currZoom = thumbParams.currZoom;
        var thumbTimeMin = thumbParams.timeMin;
        var thumbTimeMax = thumbParams.timeMax;
        var thumbTime = thumbParams.thumbTime;

        // If the visual being rendered is the first visual on the thumbnail the thumbnail needs to be created
        // Each thumbnail is it's own canvas with an ID that is the number of the thumbnail in the overall thumbnail sequence
        if(firstVisual){
            // Create the canvas for the current thumbnail to be displayed
            var canvas_html = '<canvas id="thumbnails_canvas_' + thumbOffset + '" width="' + width_offset +'" data-timemin="' + thumbTimeMin +'" data-timemax="' + thumbTimeMax +'"></canvas>';
            
            // Set the current zoom to the amount of time per thumbnail ***CHANGE THIS WITH RETIMER INFO
            // Extend the width of the overall thumbnails container to hold the new thumbnail
            $('#thumbnails_div').data("currzoom", currZoom).css({
                'width' : width_offset*(thumbOffset+2)
            });

            // Add the thumbnail to the thumbnails string
            $('#thumbnails_div').append(canvas_html)
            // Add a border to the thumbnail to divide it from the others.
            $('#thumbnails_canvas_'+thumbOffset).css({
                'border' : '1px solid #D8D8D8',
                'padding' : '1px'
                });
        }
    }

    if(vertsIter.hasNext()) {
        prev = vertsIter.next();
    }
    while (vertsIter.hasNext()) {
        curr = vertsIter.next();
        if (tVisual >= curr.getT()) { // fill path array with only the visible vertices
            var new_angle = absolute_angle(5,-5,curr.getX()-prev.getX(),curr.getY()-prev.getY());
            var new_direction = new_angle >= 0 ? 1 : -1;
            var breaking = false;
            if (old_angle !== undefined) {
                if (new_angle / old_angle < 0 || new_direction !== old_direction)
                    breaking = true;
            }
            old_angle = new_angle;
            old_direction = new_direction;
            if(isThumbnail){
                calligraphic_path.push([prev.getX(), prev.getY(), visual.getProperties().getWidth(), breaking]);
            }
            else{
                calligraphic_path.push([prev.getX(), prev.getY(), visual.getProperties().getWidth(), breaking]);
            }
        }
        prev = curr;
    }
    if (curr && tVisual >= curr.getT())
        if(isThumbnail){
            // calligraphic_path.push([curr.getX() + thumbOffset*width_offset, curr.getY(), visual.getProperties().getWidth(), false]);
            calligraphic_path.push([curr.getX(), curr.getY(), visual.getProperties().getWidth(), false]);
        }
        else{
            calligraphic_path.push([curr.getX(), curr.getY(), visual.getProperties().getWidth(), false]);
        }
    if (calligraphic_path.length > 0) { // draw calligraphic path
        var ctx;
        if(isThumbnail){
            // If it is a thumbnail, set the context canvas to the appropriate thumbnail to draw the stroke
            var canvas_value = '#thumbnails_canvas_' + thumbOffset;
            console.log("val: " + canvas_value);
            ctx = $(canvas_value)[0].getContext('2d');
        }
        else{  
            ctx = pentimento.state.context;
        }
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = visual.getProperties().getColor();
        ctx.fillStyle = visual.getProperties().getColor();
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        if(isThumbnail){
            // For the thumbnail scale down the visual to the appropriate size.
            ctx.scale(scale, scale);
            drawCalligraphicPath(0, calligraphic_path, false, ctx);
            ctx.scale(1/scale, 1/scale);
        }
        else{
            drawCalligraphicPath(0, calligraphic_path, false, ctx);
        }
    }
}

// return the absolute angle in degrees between the specified vectors
function absolute_angle(x1,y1,x2,y2) {
    return Math.acos((x1 * x2 + y1 * y2) / (Math.sqrt(x1*x1+y1*y1) * Math.sqrt(x2*x2+y2*y2)) ) / Math.PI * 180 * (Math.abs(-y1*x2+x1*y2)/(-y1*x2+x1*y2));
};

function drawCalligraphicPath(startIndex, path, reversed, context) {
    // console.log("path: " + path);
    if(startIndex === 0)
        context.beginPath();
    var point = path[startIndex];
    var endIndex = path.length-1;
    context.moveTo(point[0]+point[2],point[1]-point[2]);
    for(var i=startIndex+1; i<path.length-1; i++) {
        point = path[i];
        if(point[3]) { 
            endIndex = i+1;
            i = path.length-2;
        }
        if(reversed){
            context.lineTo(point[0]-point[2],point[1]+point[2]);
        }
        else{
            context.lineTo(point[0]+point[2],point[1]-point[2]);
        }
    }
    for(var i=endIndex; i>=startIndex; i--) {
        // console.log("here..." + i);
        point = path[i];
        if(reversed){
            context.lineTo(point[0]+point[2],point[1]-point[2]);
        }
        else{
            context.lineTo(point[0]-point[2],point[1]+point[2]);
        }
    }
    point = path[startIndex];
    context.lineTo(point[0]+point[2],point[1]-point[2]);
    if(endIndex !== path.length-1)
        drawCalligraphicPath(endIndex-1, path, !reversed, context);
    else {
        context.stroke();
        context.fill();
    }
}
