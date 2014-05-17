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
    EditGroup: "EditGroup",
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
                    drawVisual(visual);
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
            var vertsIter = visual.getVerticesIterator();
            var prev;
            if(vertsIter.hasNext()) {
                prev = vertsIter.next();
            }
            while (vertsIter.hasNext()) {
                var curr = vertsIter.next();
                var line = new Segment(prev, curr, visual.getProperties());
                drawLine(line);
                prev = curr;
            }
            break;
        case VisualTypes.dot:
            break;
        case VisualTypes.img:
            break;
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