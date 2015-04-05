// TODO: include description
'use strict';

var pentimento = {};

pentimento.DEBUG = true;

// var ActionGroups = {
//     VisualGroup: "VisualGroup", //encapsulates a single action/visual when recording
//     SubSlideGroup: "SubSlideGroup", //encapsulates the portion of a slide when recording
//     ShiftGroup: "ShiftGroup", //encapsulates a shift block, for shift as you go
//     RecordingGroup: "RecordingGroup", //the largest group when recording, encapsulates an entire recording
//     // CustomGroup: "CustomGroup"
//     EditGroup: "EditGroup" //editing is basically standalone, so you only ever have one group when editing
// };

// var ActionTitles = {
//     Recording: "Recording",
//     AdditionOfSlide: "AdditionOfSlide",
//     DeleteSlide: "DeleteSlide",
//     ShiftSlide: "ShiftSlide",
//     AdditionOfVisual: "AdditionOfVisual",
//     DeleteVisual: "DeleteVisual",
//     ShiftVisuals: "ShiftVisual(s)",
//     AdditionOfConstraint: "AdditionOfConstraint",
//     DeletionOfConstraint: "DeletionOfConstraint",
//     ShiftConstraints: "ShiftConstraints",
//     AdditionOfProperty: "AdditionOfProperty",
//     Edit: "Edit",
//     Dummy: "Dummy"
// };

var RecordingTypes = {
    VideoOnly: "VideoOnly",
    AudioOnly: "AudioOnly",
    AudioVideo: "AudioVideo"
};

// TODO: move this to undo manager
// var um = getUndoManager([ActionGroups.RecordingGroup, ActionGroups.SubSlideGroup, ActionGroups.VisualGroup, ActionGroups.EditGroup], pentimento.DEBUG);

var globalTime = function() {
    return (new Date()).getTime();
};

var Iterator = function(array) {
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
};

