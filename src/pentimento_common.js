/***********************CONFIGURATION***********************/
INTERVAL_TIMING = 50; //in ms for any intervals that need to be set in the code
DEBUG = true;
snapRecording = true;
canvasId = "sketchpad";
sliderId = "slider";
tickerId = "ticker";
/***********************CONFIGURATION***********************/


pentimento = {};

ActionGroups = {
    RecordingGroup: "RecordingGroup",
    SlideGroup: "SlideGroup",
    VisualGroup: "VisualGroup",
    EditGroup: "EditGroup"
    // CustomGroup: "CustomGroup"
};

ActionTitles = {
    AdditionOfSlide: "AdditionOfSlide",
    DeleteSlide: "DeleteSlide",
    AdditionOfVisual: "AdditionOfVisual",
    EditOfVisual: "EditOfVisual(s)",
    DeleteVisual: "DeleteVisual",
    ShiftVisuals: "ShiftVisual(s)",
    ShiftSlide: "ShiftSlide"
};

RecordingTypes = {
    VideoOnly: "VideoOnly",
    AudioOnly: "AudioOnly",
    AudioVideo: "AudioVideo"
};

um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.SlideGroup, ActionGroups.VisualGroup, ActionGroups.EditGroup], DEBUG);

function globalTime() {
    return (new Date()).getTime();
}

function Iterator(array) {
    return {
        index: -1,
        hasNext: function() { return this.index < array.length-1; },
        next: function() {
            if(this.hasNext()) {
                this.index = this.index + 1;
                return array[this.index];
            }
            return null;
        }        
    };
}

function Matrix() {
    //TODO
}

Matrix.prototype.getClone = function() {

}

/***********************RENDERING CODE***********************/
//renderer code. temporary stint until renderer code gets well integrated
function updateVisuals() {
    clear();
    var slideIter = pentimento.lecture.getSlidesIterator();
    var state = pentimento.state;
    var slideTime = state.videoCursor;
    while(slideIter.hasNext()) {
        var slide = slideIter.next();
        if(slide==state.currentSlide) {
            var visualsIter = slide.getVisualsIterator();
            while(visualsIter.hasNext()) {
                var visual = visualsIter.next();
                //visible ON tMin due to equality, deleted ON tDeletion due to lack of equality
                if (isVisualVisible(visual, slideTime)) {
                    drawVisual(visual, slideTime);
                }
            }
        } else {
            slideTime -= slide.getDuration();
        }
    }
}

function clear() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

function drawVisual(visual, tVisual) {
    //TODO SUPPORT FOR TRANSFORMS
    switch(visual.getType()) {
        case VisualTypes.basic:
            console.log("someone actually made a basic type?!",visual);
            break;
        case VisualTypes.stroke:
            var calligraphic_path = [];
            var vertsIter = visual.getVerticesIterator();
            var prev;
            var old_angle;
            if(vertsIter.hasNext()) {
                prev = vertsIter.next();
                calligraphic_path.push([prev.getX(), prev.getY(), visual.getProperties().getWidth(), false]);
            }
            while (vertsIter.hasNext()) {
                var curr = vertsIter.next();
                var line = new Segment(prev, curr, visual.getProperties());
//                drawLine(line);
                if (tVisual >= curr.getT()) { // fill path array with only the visible vertices
                    var new_angle = absolute_angle(5,-5,curr.getX()-prev.getX(),curr.getY()-prev.getY());
                    var breaking = false;
                    if (old_angle !== undefined) {
                        if (new_angle / old_angle < 0)
                            breaking = true;
                    }
                    old_angle = new_angle;
                    calligraphic_path.push([curr.getX(), curr.getY(), visual.getProperties().getWidth(), breaking]);
                }
                prev = curr;
            }
            if (calligraphic_path.length > 0) { // draw calligraphic path
                var ctx = pentimento.state.context;
                ctx.globalAlpha = 1.0;
                ctx.strokeStyle = visual.getProperties().getColor();
                ctx.lineWidth = visual.getProperties().getWidth();
                ctx.lineCap = 'round';
                drawCalligraphicPath(0, calligraphic_path, false, ctx);
            }
            break;
        case VisualTypes.dot:
            break;
        case VisualTypes.img:
            break;
    }
}

// return the absolute angle in degrees between the specified vectors
function absolute_angle(x1,y1,x2,y2) {
    return Math.acos((x1 * x2 + y1 * y2) / (Math.sqrt(x1*x1+y1*y1) * Math.sqrt(x2*x2+y2*y2)) ) / Math.PI * 180 * (Math.abs(-y1*x2+x1*y2)/(-y1*x2+x1*y2));
};

function drawCalligraphicPath(startIndex, path, reversed, context) {
    if(startIndex === 0)
        context.beginPath();
    var point = path[startIndex];
    var endIndex = path.length-1;
    context.moveTo(point[0]+point[2],point[1]-point[2]);
    for(var i=startIndex+1; i<path.length-1; i++) {
        point = path[i];
        if(point[3]) { // 
            endIndex = i+1;
            i = path.length-2;
        }
        if(reversed)
            context.lineTo(point[0]-point[2],point[1]+point[2]);
        else
            context.lineTo(point[0]+point[2],point[1]-point[2]);
    }
    for(var i=endIndex; i>=startIndex; i--) {
        point = path[i];
        if(reversed)
            context.lineTo(point[0]+point[2],point[1]-point[2]);
        else
            context.lineTo(point[0]-point[2],point[1]+point[2]);
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

function drawVisuals(visuals) {
    for (var i in visuals) {
        drawVisual(visuals[i]);
    }
}
/***********************RENDERING CODE***********************/

$(document).ready(function(){
    var iw = $(window).width();
    var ih = $(window).height();
    $('#'+canvasId)[0].width = 0.8 * iw;
    $('#'+canvasId)[0].height = 0.8 * ih;

    $('#'+sliderId).width($('canvas').width());
    $('#'+tickerId).css('position', 'absolute');
    $('#'+tickerId).css('left', parseInt($('#'+sliderId).width())+20 + 'px');
    $('#'+tickerId).css('top', parseInt($('#'+sliderId).position().top)-10 + 'px');
});