//handles mouse events and key events accordingly

function mouse_down_handler(evt) {
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

function mouse_up_handler(evt) {
    pentimento.state.lmb = false;
    pentimento.state.mmb = false;
    pentimento.state.rmb = false;
}

function key_down_handler(evt) {
    if(evt.ctrlKey) {
        pentimento.state.ctrlKey = true;
    } else if(evt.shiftKey) {
        pentimento.state.shiftKey = true;
    } else if(evt.altKey) {
        pentimento.state.altKey = true;
    }
}

function key_up_handler(evt) {
    if(evt.which == 17) { //ctrl key
        pentimento.state.ctrlKey = false;
    } else if(evt.which == 16) { //shift key
        pentimento.state.shiftKey = false;
    } else if(evt.which == 18) {
        pentimento.state.altKey = false;
    }
}

function undo_listener(event) {
    if(um.getUndoLength() > 0) {
        $('.forever-tool[data-toolname="undo"]').removeAttr('disabled');
    } else {
        $('.forever-tool[data-toolname="undo"]').attr('disabled', 'disabled');
    }
}

function redo_listener(event) {
    if(um.getRedoLength() > 0) {
        $('.forever-tool[data-toolname="redo"]').removeAttr('disabled');
    } else {
        $('.forever-tool[data-toolname="redo"]').attr('disabled', 'disabled');
    }
}

$(document).ready(function() {
    $(pentimento.state.canvas).on('mousedown', mouse_down_handler);
    $(window).on('mouseup', mouse_up_handler);
    $(window).on('keydown', key_down_handler);
    $(window).on('keyup', key_up_handler);
    $(window).on('click', undo_listener);
    $(window).on('click', redo_listener)
})