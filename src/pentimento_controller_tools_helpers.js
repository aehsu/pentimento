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
        ctx.strokeStyle = segment.getProperties().color;
        ctx.lineWidth = segment.getProperties().width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}


// Returns the location of the event on the canvas, as opposed to on the page
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

function clearPreviousHandlers() {
    //clear some handlers
    pentimento.state.canvas.off('mousedown');
    pentimento.state.canvas.off('mousemove');
    $(window).off('mouseup');
    
    //re-attach the necessary ones
    $(pentimento.state.canvas).on('mousedown', mouseDownHandler);
    $(window).on('mouseup', mouseUpHandler);
    $(window).on('keydown', keyDownHandler);
    $(window).on('keyup', keyUpHandler);
    pentimento.state.tool = null;
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

// Handler function for a mousedown on the canvas
function penMouseDown(event) {
    if (! pentimento.state.isRecording){return;}
    event.preventDefault();
    var state = pentimento.state; //reference
    state.currentVisual = new StrokeVisual(globalTime(), {
        color: state.color,
        width: state.width
    });
    state.lastPoint = getCanvasPoint(event);
    state.currentVisual.getVertices().push(state.lastPoint);
}

function penMouseMove(event) {
    if (!pentimento.state.isRecording){return;}
    event.preventDefault();  
    var state = pentimento.state; //reference

    if (state.lmb) {
        var curPoint = getCanvasPoint(event);
        drawLine(new Segment(state.lastPoint,curPoint, state.currentVisual.getProperties()));
        state.lastPoint = curPoint;
        state.currentVisual.getVertices().push(curPoint);
    }
}

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

function selectMouseDown(event) { //non-live handler
    if (pentimento.state.isRecording) {return ;}
    event.preventDefault();
    var state = pentimento.state;

    updateVisuals();
    state.lastPoint = getCanvasPoint(event);
    state.selection = [];
}

function selectMouseMove(event) {
    if (pentimento.state.isRecording||!pentimento.state.lmb) {return ;}
    event.preventDefault();
    var state = pentimento.state;

    updateVisuals();
    var coord = getCanvasPoint(event);
    var ctx = state.context;
    var width = state.width;
    var style = state.color;
    ctx.strokeStyle = "#0000FF";
    ctx.lineWidth = 2;
    ctx.strokeRect(state.lastPoint.x, state.lastPoint.y, coord.x-state.lastPoint.x, coord.y-state.lastPoint.y);
    state.selection = [];

    function determineInside(state, x, y, coord) {
        if(x >= state.lastPoint.x && x <= coord.x) {
            if (y>=state.lastPoint.y && y<=coord.y) {
                return true;
            } else if(y<=state.lastPoint.y && y>=coord.y) {
                return true;
            }
        } else if(x<=state.lastPoint.x && x>=coord.x) {
            if (y>=state.lastPoint.y && y<=coord.y) {
                return true;
            } else if(y<=state.lastPoint.y && y>=coord.y) {
                return true;
            }
        }
        return false;
    }

    if(!state.currentSlide) {
        console.log("this should never happen inside of the selection handler for mousemove");
        ctx.strokeStyle = style; // should be valid if you say pentimento.state.color
        ctx.lineWidth = width; // should be valid if you say pentimento.state.width
        return;
    }
    for(vis in state.currentSlide.visuals) {
        var visual = state.currentSlide.visuals[vis];
        var nVert = 0;
        for (vert in visual.vertices) {
            if(visual.tMin > state.videoCursor || (visual.tDeletion != undefined && visual.tDeletion < state.videoCursor)) { continue; }
            var x = visual.vertices[vert].x;
            var y = visual.vertices[vert].y;

            if (determineInside(state,x,y,coord)) { //check for deletion/appearance.
                nVert++;
            }
        }
        if(nVert/visual.vertices.length >= .45) {
            state.selection.push(visual);
        }
    }

    for(vis in state.selection) {
        var visCopy = $.extend(true, {}, state.selection[vis]);
        visCopy.properties.width = state.selection[vis].properties.width+1;
        visCopy.properties.color = "#0000FF";
        drawVisual(visCopy.access());
    }

    ctx.strokeStyle = style; // should be valid if you say pentimento.state.color
    ctx.lineWidth = width; // should be valid if you say pentimento.state.width
}

function selectMouseUp(event) {
    if (pentimento.state.isRecording) {return ;}
    event.preventDefault();

    var state =  pentimento.state;
    updateVisuals();
    for(vis in state.selection) {
        var visCopy = $.extend(true, {}, state.selection[vis]);
        visCopy.properties.width = state.selection[vis].properties.width+1;
        visCopy.properties.color = "#0000FF";
        drawVisual(visCopy.access());
    }
}