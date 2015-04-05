// handles mouse events and key events
"use strict";

var mouseDownHandler = function(evt) {
    switch(evt.which) {
        case 1:
            pentimento.lectureController.leftMouseButton = true;
            break;
        case 2:
            pentimento.lectureController.middleMouseButton = true;
            break;
        case 3:
            pentimento.lectureController.rightMouseButton = true;
            break;
        default:
            console.log("unique mouse hardware?", evt);
            break;
    }
}

var mouseUpHandler = function(evt) {
    pentimento.lectureController.leftMouseButton = false;
    pentimento.lectureController.middleMouseButton = false;
    pentimento.lectureController.rightMouseButton = false;
}

var keyDownHandler = function(evt) {
    if(evt.ctrlKey) {
        pentimento.lectureController.ctrlKey = true;
    } else if(evt.shiftKey) {
        pentimento.lectureController.shiftKey = true;
    } else if(evt.altKey) {
        pentimento.lectureController.altKey = true;
    }
}

var keyUpHandler = function(evt) {
    if(evt.which == 17) { //ctrl key
        pentimento.lectureController.ctrlKey = false;
    } else if(evt.which == 16) { //shift key
        pentimento.lectureController.shiftKey = false;
    } else if(evt.which == 18) {
        pentimento.lectureController.altKey = false;
    }
}

// var undoListener(event) {
//     if(um.getUndoLength() > 0) {
//         $('.um-tool[data-toolname="undo"]').removeAttr('disabled'); //everything

//         for(var attr in ActionGroups) {
//             if(um.canUndo(attr)) {
//                 $('.um-tool[data-toolname="undo"]').text('Undo-'+attr);
//                 $('.um-tool[data-toolname="undo"]').attr('data-group', attr)
//                 break;
//             }
//         }
//     } else {
//         $('.um-tool[data-toolname="undo"]').attr('disabled', 'disabled');
//         $('.um-tool[data-toolname="undo"]').each(var() { $(this).text('Undo'); });
//         $('.um-tool[data-toolname="undo"]').removeAttr('data-group');
//     }
// }

// var redoListener(event) {
//     if(um.getRedoLength() > 0) {
//         $('.um-tool[data-toolname="redo"]').removeAttr('disabled');
//         for(var attr in ActionGroups) {
//             if(um.canRedo(attr)) {
//                 $('.um-tool[data-toolname="redo"]').text('Redo-'+attr);
//                 $('.um-tool[data-toolname="redo"]').attr('data-group', attr);
//                 break;
//             }
//         }
//     } else {
//         $('.um-tool[data-toolname="redo"]').attr('disabled', 'disabled');
//         $('.um-tool[data-toolname="redo"]').each(var() { $(this).text('Redo'); });
//         $('.um-tool[data-toolname="redo"]').removeAttr('data-group');
//     }
// }
