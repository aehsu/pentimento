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
    VisualGroup: "VisualGroup", //encapsulates a single action/visual when recording
    SubSlideGroup: "SubSlideGroup", //encapsulates the portion of a slide when recording
    ShiftGroup: "ShiftGroup", //encapsulates a shift block, for shift as you go
    RecordingGroup: "RecordingGroup", //the largest group when recording, encapsulates an entire recording
    // CustomGroup: "CustomGroup"
    EditGroup: "EditGroup" //editing is basically standalone, so you only ever have one group when editing
};

ActionTitles = {
    Recording: "Recording",
    AdditionOfSlide: "AdditionOfSlide",
    DeleteSlide: "DeleteSlide",
    ShiftSlide: "ShiftSlide",
    AdditionOfVisual: "AdditionOfVisual",
    DeleteVisual: "DeleteVisual",
    ShiftVisuals: "ShiftVisual(s)",
    AdditionOfConstraint: "AdditionOfConstraint",
    DeletionOfConstraint: "DeletionOfConstraint",
    ShiftConstraints: "ShiftConstraints",
    AdditionOfProperty: "AdditionOfProperty",
    Edit: "Edit",
    Dummy: "Dummy"
};

RecordingTypes = {
    VideoOnly: "VideoOnly",
    AudioOnly: "AudioOnly",
    AudioVideo: "AudioVideo"
};

um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.SubSlideGroup, ActionGroups.VisualGroup, ActionGroups.EditGroup], DEBUG);

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

    window.retimer_window = window.open("retimer.html");

});