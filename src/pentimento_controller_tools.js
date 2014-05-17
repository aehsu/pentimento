//Various tools may need to update the state of the view, so the updates are all called here
//within this file for the editing tools. Unfortunately, the undo of an action may need to update
//the view to propertly display a consistent state, so there are invocations of updateVisuals in those
//undo functions as well. It's up to each switch statement to determine when to update 
//the state of the visuals appropriately for each tool

function lectureToolHandler(tool, event) {
    switch(tool) {
    	case 'pen':
            pentimento.state.canvas.on('mousedown', function(event) {
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                penMouseDown(event);
            });
            pentimento.state.canvas.on('mousemove', function(event){
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                penMouseMove(event);
            });
            $(window).on('mouseup', function(event) {
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                penMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
        case 'highlight':
            pentimento.state.canvas.on('mousedown', function(event) {
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                highlightMouseDown(event);
            });
            pentimento.state.canvas.on('mousemove', function(event) {
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                highlightMouseMove(event);
            });
            $(window).on('mouseup', function(event) {
                if (!pentimento.state.isRecording){return;}
                event.preventDefault();
                highlightMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
        case 'add-slide':
            if(pentimento.state.isRecording) {
                pentimento.recordingController.addSlide();
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
            playInterval = setInterval(function() {
                if(pentimento.state.videoCursor + INTERVAL_TIMING <= pentimento.lectureController.getLectureDuration()) {
                    pentimento.timeController.updateVideoTime(pentimento.state.videoCursor+INTERVAL_TIMING);
                    updateVisuals();
                } else {
                    clearInterval(playInterval);
                    $('input[data-toolname="play"]').toggleClass('hidden');
                    $('input[data-toolname="pause"]').toggleClass('hidden');
                }
            }, INTERVAL_TIMING);
            $('input[data-toolname="play"]').toggleClass('hidden');
            $('input[data-toolname="pause"]').toggleClass('hidden');
    		break;
        case 'pause':
            clearInterval(playInterval);
            $('input[data-toolname="play"]').toggleClass('hidden');
            $('input[data-toolname="pause"]').toggleClass('hidden');
            break;
    	case 'hyperlink':
    		break;
    	case 'color':
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(function(event) {
                if (pentimento.state.isRecording) {return ;}
                event.preventDefault();
                updateVisuals();
                editSelectMouseDown(event);
            });
            pentimento.state.canvas.mousemove(function(event) {
                if (pentimento.state.isRecording||!pentimento.state.lmb) {return ;}
                event.preventDefault();
                updateVisuals();
                editSelectMouseMove(event);
            });
            $(window).mouseup(function(event) {
                if (pentimento.state.isRecording) {return ;}
                event.preventDefault();
                updateVisuals();
                editSelectMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
    	case 'delete':
            if (pentimento.state.isRecording) { return; }
            //could check for empty selection? UI decision, not mine
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            um.endHierarchy(ActionGroups.EditGroup);
            pentimento.state.selection = [];
            updateVisuals();
    		break;
        case 'redraw':
            // pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            // pentimento.recording_controller.beginRedrawing();
            // $('.recording-tool').toggleClass('hidden');
            // $('button[data-toolname="pen"]').click();
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
        case 'delete-slide':
            if(pentimento.state.isRecording) { return; }
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.deleteSlide(pentimento.state.currentSlide);
            um.endHierarchy(ActionGroups.EditGroup);
            updateVisuals();
        case 'rewind':
            break;
    	case 'pan':
    		break;
        //etc...
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

function recordingToolHandler(event) {
    var elt = $(event.target);
    pentimento.state.selection  = [];
    updateVisuals(); //clear any selection when switching modes
    if (elt.attr('data-toolname')==='begin') {
        pentimento.recordingController.beginRecording();
        $('input[data-toolname="pen"]').click();
    } else {
        pentimento.recordingController.stopRecording();
        pentimento.state.tool = null;
    }
    $('.recording-tool').toggleClass('hidden');
}

function umToolHandler(event) {
    var elt = $(event.target);
    if(elt.prop('disabled')=='disabled') {
        return;
    } else if(elt.attr('data-toolname')=='undo') {
        var group = um.getUndoGroups();
        group = group[group.length-1];
        um.undoHierarchy(group);
    } else if(elt.attr('data-toolname')=='redo') {
        // var group = um.getRedoGroups();
        // group = group[group.length-1];
        // um.redoHierarchy(group);

        //so very temporary
        alert('Redo is currently disabled with the view. Once groups are handled with undo manager with redo-ing, we\'ll support this. Sorry for any inconvenience.');
        throw {name: "RedoActionError", message:"The undo manager does not currently support group\
         labelling on the redo, hence redo has been disabled."};
    }
    $(window).click(); //updates the state of the undo and redo buttons correctly
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
    $('.um-tool').click(umToolHandler);
    $('.recording-tool').click(recordingToolHandler);
})