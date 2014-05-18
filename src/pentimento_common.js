/***********************CONFIGURATION***********************/
INTERVAL_TIMING = 50; //in ms for any intervals that need to be set in the code
SHIFT_INTERVAL = 1000;
DEBUG = true;
snapRecording = true;
canvasId = "sketchpad";
sliderId = "slider";
tickerId = "ticker";
/***********************CONFIGURATION***********************/


pentimento = {};

ActionGroups = {
    EditGroup: "EditGroup", //editing is basically standalone, so you only ever have one group when editing
    VisualGroup: "VisualGroup", //encapsulates a single action/visual when recording
    ShiftGroup: "ShiftGroup", //encapsulates a shift block
    SlideGroup: "SlideGroup", //encapsulates the portion of a slide when recording
    RecordingGroup: "RecordingGroup" //the largest group when recording, encapsulates an entire recording
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