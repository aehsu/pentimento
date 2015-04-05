// handles mouse events and key events
"use strict";

function mouseDownHandler(evt) {
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

function mouseUpHandler(evt) {
    pentimento.lectureController.leftMouseButton = false;
    pentimento.lectureController.middleMouseButton = false;
    pentimento.lectureController.rightMouseButton = false;
}

function keyDownHandler(evt) {
    if(evt.ctrlKey) {
        pentimento.lectureController.ctrlKey = true;
    } else if(evt.shiftKey) {
        pentimento.lectureController.shiftKey = true;
    } else if(evt.altKey) {
        pentimento.lectureController.altKey = true;
    }
}

function keyUpHandler(evt) {
    if(evt.which == 17) { //ctrl key
        pentimento.lectureController.ctrlKey = false;
    } else if(evt.which == 16) { //shift key
        pentimento.lectureController.shiftKey = false;
    } else if(evt.which == 18) {
        pentimento.lectureController.altKey = false;
    }
}

// function undoListener(event) {
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
//         $('.um-tool[data-toolname="undo"]').each(function() { $(this).text('Undo'); });
//         $('.um-tool[data-toolname="undo"]').removeAttr('data-group');
//     }
// }

// function redoListener(event) {
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
//         $('.um-tool[data-toolname="redo"]').each(function() { $(this).text('Redo'); });
//         $('.um-tool[data-toolname="redo"]').removeAttr('data-group');
//     }
// }
