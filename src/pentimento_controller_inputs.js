//handles mouse events and key events accordingly

function mouseDownHandler(evt) {
    switch(evt.which) {
        case 1:
            pentimento.state.lmb = true;
            break;
        case 2:
            pentimento.state.mmb = true;
            break;
        case 3:
            pentimento.state.rmb = true;
            break;
        default:
            console.log("unique mouse hardware?", evt);
            break;
    }
}

function mouseUpHandler(evt) {
    pentimento.state.lmb = false;
    pentimento.state.mmb = false;
    pentimento.state.rmb = false;
}

function keyDownHandler(evt) {
    if(evt.ctrlKey) {
        pentimento.state.ctrlKey = true;
    } else if(evt.shiftKey) {
        pentimento.state.shiftKey = true;
    } else if(evt.altKey) {
        pentimento.state.altKey = true;
    }
}

function keyUpHandler(evt) {
    if(evt.which == 17) { //ctrl key
        pentimento.state.ctrlKey = false;
    } else if(evt.which == 16) { //shift key
        pentimento.state.shiftKey = false;
    } else if(evt.which == 18) {
        pentimento.state.altKey = false;
    }
}

function undoListener(event) {
    if(um.getUndoLength() > 0) {
        $('.um-tool[data-toolname="undo"]').removeAttr('disabled');
        for(var attr in ActionGroups) {
            if(um.canUndo(attr)) {
                $('.um-tool[data-toolname="undo"]').each(function() {
                    $(this).text('Undo-'+attr);
                    $(this).attr('data-group', attr)
                });
                break;
            }
        }
    } else {
        $('.um-tool[data-toolname="undo"]').attr('disabled', 'disabled');
        $('.um-tool[data-toolname="undo"]').each(function() { $(this).text('Undo'); });
        $('.um-tool[data-toolname="undo"]').removeAttr('data-group');
    }
}

function redoListener(event) {
    if(um.getRedoLength() > 0) {
        $('.um-tool[data-toolname="redo"]').removeAttr('disabled');
        for(var attr in ActionGroups) {
            if(um.canRedo(attr)) {
                $('.um-tool[data-toolname="redo"]').each(function() {
                    $(this).text('Redo-'+attr);
                    $(this).attr('data-group', attr)
                });
                break;
            }
        }
    } else {
        $('.um-tool[data-toolname="redo"]').attr('disabled', 'disabled');
        $('.um-tool[data-toolname="redo"]').each(function() { $(this).text('Redo'); });
        $('.um-tool[data-toolname="redo"]').removeAttr('data-group');
    }
}

$(document).ready(function() {
    $(pentimento.state.canvas).on('mousedown', mouseDownHandler);
    $(window).on('mouseup', mouseUpHandler);
    $(window).on('keydown', keyDownHandler);
    $(window).on('keyup', keyUpHandler);
    $(window).on('click', undoListener);
    $(window).on('click', redoListener)
})