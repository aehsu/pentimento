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