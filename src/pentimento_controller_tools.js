//Various tools may need to update the state of the view, so the updates are all called here
//within this file. You'll see the various invocations of updateVisuals(). It's up to each
//switch statement to determine when to update the state of the visuals appropriately
//for each tool

function lectureToolHandler(tool, event) {
    switch(tool) {
    	case 'pen':
            pentimento.state.canvas.on('mousedown', penMouseDown);
            pentimento.state.canvas.on('mousemove', penMouseMove);
            $(window).on('mouseup', penMouseUp);
            pentimento.state.tool = tool;
            break;
        case 'highlight':
            pentimento.state.canvas.on('mousedown', penMouseDown);
            pentimento.state.canvas.on('mousemove', penMouseMove);
            $(window).on('mouseup', highlightMouseUp);
            pentimento.state.tool = tool;
            break;
    	case 'dots':
    		break;
        case 'add-slide':
            if(pentimento.state.isRecording) {
                pentimento.recordingController.addSlide();
                $('input[data-toolname="pen"]').click();
            }
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
            break;
    	case 'color':
    		break;
    	case 'width':
            pentimento.state.width = parseInt($(event.target).val());
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
    		break;
        case 'select':
            break;
    	case 'delete':
    		break;
    	case 'pan':
    		break;
    	case 'clear':
		    clear();
    		break;
    	default:
		    pentimento.state.tool = null;
    		console.log('Unrecognized tool clicked, live tools');
    		console.log(tool);
            console.log(event);
    }
}

//Editing tools handling. These are typically direct invocations of the proper
//controller to handle the lecture model directly. Therefore, the handling of groups for
//the editing tools also belongs here.
function editToolHandler(tool, event) {
    switch(tool) {
    	case 'play': //also includes pause
            if (pentimento.state.isRecording) {return ;}
            pentimento.state.playInterval = setInterval(function() {
                if(pentimento.state.videoCursor + INTERVAL_TIMING <= pentimento.lectureController.getLectureDuration()) {
                    pentimento.timeController.updateVideoTime(pentimento.state.videoCursor+INTERVAL_TIMING);
                    updateVisuals();
                } else {
                    clearInterval(pentimento.state.playInterval);
                    $('input[data-toolname="play"]').toggleClass('hidden');
                    $('input[data-toolname="pause"]').toggleClass('hidden');
                }
            }, INTERVAL_TIMING);
            $('input[data-toolname="play"]').toggleClass('hidden');
            $('input[data-toolname="pause"]').toggleClass('hidden');
    		break;
        case 'pause':
            clearInterval(pentimento.state.playInterval);
            $('input[data-toolname="play"]').toggleClass('hidden');
            $('input[data-toolname="pause"]').toggleClass('hidden');
            break;
    	case 'hyperlink':
    		break;
    	case 'color':
    		break;
    	case 'width':
            if(event.target.value=="" || pentimento.state.isRecording) { return; }
            //could check for empty selection. UI decision, not mine
            var newWidth = parseInt(event.target.value);
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.visualsController.editWidth(pentimento.state.selection, newWidth);
            um.endHierarchy(ActionGroups.EditGroup);
            updateVisuals();
            $('.edit-tool[data-toolname="width"]').val('');
    		break;
    	case 'delete':
            if (pentimento.state.isRecording) { return; }
            //could check for empty selection. UI decision, not mine
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            um.endHierarchy(ActionGroups.EditGroup);
            pentimento.state.selection = [];
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(function(event) {
                if (pentimento.state.isRecording) {return ;}
                event.preventDefault();
                updateVisuals();
                selectMouseDown(event);
            });
            pentimento.state.canvas.mousemove(function(event) {
                if (pentimento.state.isRecording||!pentimento.state.lmb) {return ;}
                event.preventDefault();
                updateVisuals();
                selectMouseMove(event);
            });
            $(window).mouseup(function(event) {
                if (pentimento.state.isRecording) {return ;}
                event.preventDefault();
                updateVisuals();
                selectMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
        case 'redraw':
            // pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            // pentimento.recording_controller.beginRedrawing();
            // $('.recording-tool').toggleClass('hidden');
            // $('button[data-toolname="pen"]').click();
            break;
        case 'rewind':
            break;
    	case 'pan':
    		break;
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

function recordingToolHandler(event) {
    var elt = $(event.target);
    if (elt.attr('data-toolname')==='begin') {
        pentimento.recordingController.beginRecording();
        $('input[data-toolname="pen"]').click();
    } else {
        pentimento.recordingController.stopRecording();
        pentimento.state.tool = null;
    }
    $('.recording-tool').toggleClass('hidden');
}

function undoToolHandler(event) {
    var elt = $(event.target);
    if(elt.prop('disabled')=='disabled') {
        return;
    } else if(elt.attr('data-toolname')=='undo') {
        um.undo();
    } else if(elt.attr('data-toolname')=='redo') {
        um.redo();
    }
    $(window).click();
}

$(document).ready(function() {
    $('.lecture-tool').click(function(event) {
        event.stopPropagation(); 
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        lectureToolHandler(tool, event);
    });
    $('.lecture-tool').change(function(event) {
        event.stopPropagation();
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        lectureToolHandler(tool, event);
    });

    $('.edit-tool').click(function(event) {
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        editToolHandler(tool, event);
    });
    $('.um-tool').click(undoToolHandler);
    $('.recording-tool').click(recordingToolHandler);
})