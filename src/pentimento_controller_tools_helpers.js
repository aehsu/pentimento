//This helps in redering, but is fundamental to the tool handlers themselves.
//Only "finished" visuals leave the buffer and are put into the model, so
//something needs to draw the buffered visuals, like the handlers.

//Draws a line segment based on a from point and a to point,
//with a set of properties. Whoever calls this is in charge of giving the
//segment the correct properties
function drawLine(segment) {
    var ctx = pentimento.state.context;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(segment.getFromPoint().getX(), segment.getFromPoint().getY());
    ctx.lineTo(segment.getToPoint().getX(), segment.getToPoint().getY());

    if (pentimento.state.pressure) { //some fancy stuff based on pressure
        /*var avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

        if (pressure_color) {
            var alpha = (1 - 0.5) + 0.5 * avg_pressure
            line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
        }
        else { line.color = 'rgba(64,64,64,1)' }   // todo use defaults

        if (pressure_width) { line.width = 1 + Math.round(max_extra_line_width * avg_pressure) }  // todo use defaults
        else { line.width = 2 } // todo use defaults

        canvas.drawLine(line)*/
    } else {
        ctx.strokeStyle = segment.getProperties().getColor();
        ctx.lineWidth = segment.getProperties().getWidth();
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

//The semantic is that visuals are visible exactly ON their tMin, not later
//Therefore, when time hits tMin, the visual is visible
//Likewise, visuals are deleted ON their tDeletion, not later
//Therefore, when time his tDeletion, the visual is no longer visible
function isVisualVisible(visual, tVisual) {
    if(visual.getTMin() > tVisual) { return false; }
    if(visual.getTDeletion() != null && visual.getTDeletion() >= tVisual) { return false; }

    return true;
}

//The semantic is the same as that for a visual, a vertex is visible ON its t value
//This function can be modified if we decide to later support erasure
function isVertexVisible(vertex, tVisual) {
    if(vertex.getT() > tVisual) { return false; }

    return true;
}

// Gives the location of the event on the canvas, as opposed to on the page
// Returns: Vertex(x,y,t,p) with x,y on the canvas, and t a global time
function getCanvasPoint(event){
    var x = event.pageX - pentimento.state.canvas.offset().left;
    var y = event.pageY - pentimento.state.canvas.offset().top;
    var t = globalTime();
    
    if(pentimento.state.pressure) {
        return new Vertex(x, y, t, event.pressure);
    } else {
        return new Vertex(x, y, t);
    }
}

//Removes handlers from the previous tool, while preserving other handlers
//not related to the previous tool
function clearPreviousHandlers() {
    pentimento.state.canvas.off('mousedown');
    pentimento.state.canvas.off('mousemove');
    $(window).off('mouseup');
    
    //re-attach the necessary ones
    $(pentimento.state.canvas).on('mousedown', mouseDownHandler);
    $(window).on('mouseup', mouseUpHandler);
    $(window).on('keydown', keyDownHandler);
    $(window).on('keyup', keyUpHandler);
}

/***********************************************************************/
/***********************************************************************/
/***********************************************************************/


// Handler function for a mousedown on the canvas
function dotsMouseDown(event) {
    //TODO
}

function dotsMouseMove(event) {
    //TODO
}

function dotsMouseUp(event) {
    //TODO
}

//lecture tool
function penMouseDown(event) {
    if (!pentimento.state.isRecording){return;}
    event.preventDefault();
    var state = pentimento.state; //reference
    state.currentVisual = new StrokeVisual(globalTime(), new VisualProperty(state.color, state.width));
    state.lastPoint = getCanvasPoint(event);
    state.currentVisual.getVertices().push(state.lastPoint);
}

//lecture tool
function penMouseMove(event) {
    if (!pentimento.state.isRecording){return;}
    event.preventDefault();  
    var state = pentimento.state; //reference

    if (state.lmb) {
        var curPoint = getCanvasPoint(event);
        state.lastPoint = curPoint;
        state.currentVisual.getVertices().push(curPoint);
        updateVisuals();
    }
}

//lecture tool
function penMouseUp(event) {
    if (!pentimento.state.isRecording){return;}
    event.preventDefault();

    var state = pentimento.state;
    if(state.currentVisual) { //check for not null and not undefined  != null && !=undefined
        pentimento.recordingController.addVisual(state.currentVisual);
        state.currentVisual = null;
        state.lastPoint = null;
    }
}

//lecture tool
function highlightMouseUp(event) {
    if (!pentimento.state.isRecording){return;}
    event.preventDefault();

    var state = pentimento.state;
    if(state.currentVisual) { //check for not null and not undefined  != null && !=undefined
        state.currentVisual.tDeletion = globalTime()+3000; //highlighing duration
        pentimento.recordingController.addVisual(state.currentVisual);
        state.currentVisual = null;
        state.lastPoint = null;
    }
}

//edit tool
function selectMouseDown(event) {
    var state = pentimento.state;
    state.lastPoint = getCanvasPoint(event);
    state.selection = [];
}

//edit tool
function selectMouseMove(event) {
    var state = pentimento.state;

    var coord = getCanvasPoint(event);
    var ctx = state.context;
    state.selection = [];

    function isInside(startPoint, endPoint, testPoint) {
        var xStart = startPoint.getX();
        var yStart = startPoint.getY();
        var xEnd = endPoint.getX();
        var yEnd = endPoint.getY();
        var x = testPoint.getX();
        var y = testPoint.getY();
        var xcheck = (xEnd >= xStart && xEnd >= x && x >= xStart) || (xEnd <= xStart && xEnd <= x && x <= xStart);
        var ycheck = (yEnd >= yStart && yEnd >= y && y >= yStart) || (yEnd <= yStart && yEnd <= y && y <= yStart);

        return xcheck && ycheck;
    }

    var visualsIter = state.currentSlide.getVisualsIterator();
    while(visualsIter.hasNext()) {
        var visual = visualsIter.next();
        if (!isVisualVisible(visual, state.videoCursor)) { continue; }

        var nVert = 0;
        var vertIter = visual.getVerticesIterator();
        while (vertIter.hasNext()) {
            var vertex = vertIter.next();
            if (!isVertexVisible(vertex, state.videoCursor)) { continue; }
            if (isInside(state.lastPoint, coord, vertex)) { nVert++; }
        }
        if(nVert/visual.getVertices().length >= .45) {
            state.selection.push(visual);
        }
    }

    updateVisuals();
    ctx.strokeStyle = "#0000FF";
    ctx.lineWidth = 2;
    ctx.strokeRect(state.lastPoint.getX(), state.lastPoint.getY(), coord.getX()-state.lastPoint.getX(), coord.getY()-state.lastPoint.getY());

    ctx.strokeStyle = pentimento.state.color; // should be valid if you say pentimento.state.color
    ctx.lineWidth = pentimento.state.width; // should be valid if you say pentimento.state.width
}

//edit tool
function selectMouseUp(event) {
    var state =  pentimento.state;

    updateVisuals();
}