/***********************CONFIGURATION***********************/
INTERVAL_TIMING = 50; //in ms for any intervals that need to be set in the code
DEBUG = true;
canvasId = "sketchpad";
sliderId = "slider";
tickerId = "ticker";
/***********************CONFIGURATION***********************/


pentimento = {};

ActionGroups = {
    RecordingGroup: "RecordingGroup",
    SlideGroup: "SlideGroup",
};

ActionTitles = {
    AdditionOfSlide: "AdditionOfSlide",
    DeleteSlide: "DeleteSlide",
    UnaddSlide: "UnaddSlide",
    AdditionOfVisual: "AdditionOfVisual",
    UnaddVisual: "UnaddVisual",
    DeleteVisual: "DeleteVisual",
    ShiftVisuals: "ShiftVisual(s)",
    ShiftSlide: "ShiftSlide"
};

RecordingTypes = {
    VideoOnly: "VideoOnly",
    AudioOnly: "AudioOnly",
    AudioVideo: "AudioVideo"
};

um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.VisualGroup, ActionGroups.AudioGroup], DEBUG);

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

/***********************RENDERING CODE***********************/
//renderer code. temporary stint until renderer code gets well integrated
function updateVisuals() {
    clear();
    var slideIter = pentimento.lecture.getSlidesIterator();
    var state = pentimento.state;
    var slideTime = state.videoCursor;
    var visuals = [];
    while(slideIter.hasNext()) {
        var slide = slideIter.next();
        if(slide==state.currentSlide) { //if(running_time + slide_accessor.duration() < pentimento.state.current_time) //
            var visualsIter = slide.getVisualsIterator();
            while(visualsIter.hasNext()) {
                var visual = visualsIter.next();
                if(slideTime > visual.getTMin() && 
                    (visual.getTDeletion()==null) || (slideTime < visual.getTDeletion()) ) {
                    drawVisual(visual);
                }
            }
        } else {
            slideTime -= slide.duration;
        }
    }
}

function clear() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

function drawVisual(visual) {
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