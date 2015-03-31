//Various tools may need to update the state of the view, so the updates are all called here
//within this file for the editing tools. Unfortunately, the undo of an action may need to update
//the view to propertly display a consistent state, so there are invocations of updateVisuals in those
//undo functions as well. It's up to each switch statement to determine when to update 
//the state of the visuals appropriately for each tool

function lectureToolHandler(tool, event) {
    switch(tool) {
    	case 'pen':
            pentimento.state.canvas.on('mousedown', function(event) {
                if (!pentimento.timeController.isRecording()){ return; }
                event.preventDefault();
                penMouseDown(event);
            });
            pentimento.state.canvas.on('mousemove', function(event){
                if (!pentimento.timeController.isRecording()){return;}
                event.preventDefault();
                penMouseMove(event);
            });
            $(window).on('mouseup', function(event) {
                if (!pentimento.timeController.isRecording()){return;}
                event.preventDefault();
                penMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
        case 'highlight':
            pentimento.state.canvas.on('mousedown', function(event) {
                if (!pentimento.timeController.isRecording()){return;}
                event.preventDefault();
                highlightMouseDown(event);
            });
            pentimento.state.canvas.on('mousemove', function(event) {
                if (!pentimento.timeController.isRecording()){return;}
                event.preventDefault();
                highlightMouseMove(event);
            });
            $(window).on('mouseup', function(event) {
                if (!pentimento.timeController.isRecording()){return;}
                event.preventDefault();
                highlightMouseUp(event);
            });
            pentimento.state.tool = tool;
            break;
        case 'add-slide':
            if(pentimento.timeController.isRecording()) {
                pentimento.recordingController.addSlide();
            }
            $(window).click();
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
            break;
    	case 'color':
    		break;
    	case 'width':
            pentimento.state.width = parseInt($(event.target).val());
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(function(event) {
                if (!pentimento.timeController.isRecording()) {return ;}
                event.preventDefault();
                lectureSelectMouseDown(event);
            });
            pentimento.state.canvas.mousemove(function(event) {
                if (!pentimento.timeController.isRecording()||!pentimento.state.lmb) {return ;}
                event.preventDefault();
                lectureSelectMouseMove(event);
            });
            $(window).mouseup(function(event) {
                if (!pentimento.timeController.isRecording()) {return ;}
                event.preventDefault();
                lectureSelectMouseUp(event);
            });
            break;
    	case 'delete':
            pentimento.recordingController.setTDeletion(pentimento.state.selection, globalTime());
    		break;
    	case 'pan':
    		break;
    	case 'undo':
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
            break;
        case 'redo':
            lectureToolHandler(pentimento.state.tool); //restore the previous tool
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
            if (pentimento.timeController.isRecording()) {return ;}
            playInterval = setInterval(function() {
                if(pentimento.timeController.getTime() + INTERVAL_TIMING <= pentimento.lectureController.getLectureDuration()) {
                    pentimento.timeController.updateTime(pentimento.timeController.getTime()+INTERVAL_TIMING);
                    updateVisuals(false);
                    drawThumbnails(1000,1);
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
                if (pentimento.timeController.isRecording()) {return ;}
                event.preventDefault();
                updateVisuals(false);
                drawThumbnails(1000,1);
                editSelectMouseDown(event);
            });
            pentimento.state.canvas.mousemove(function(event) {
                if (pentimento.timeController.isRecording()||!pentimento.state.lmb) {return ;}
                event.preventDefault();
                updateVisuals(false);
                drawThumbnails(1000,1);
                editSelectMouseMove(event);
            });
            $(window).mouseup(function(event) {
                if (pentimento.timeController.isRecording()) {return ;}
                event.preventDefault();
                updateVisuals(false);
                drawThumbnails(1000,1);
                editSelectMouseUp(event);
            });
            break;
    	case 'delete':
            if (pentimento.timeController.isRecording() || pentimento.state.selection.length==0) { return; }
            um.startHierarchy(ActionGroups.EditGroup);
            var t = pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            um.endHierarchy(ActionGroups.EditGroup);
            pentimento.timeController.updateTime(t);
            // pentimento.state.selection = []; //Richard says no!
            updateVisuals(false);
            drawThumbnails(1000,1);
    		break;
        case 'redraw':
            um.startHierarchy(ActionGroups.EditGroup);
            var t = pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            um.endHierarchy(ActionGroups.EditGroup);
            pentimento.timeController.updateTime(t);
            $('.recording-tool:visible').click()
            break;
        case 'width':
            if(event.target.value=="" || pentimento.timeController.isRecording() || pentimento.state.selection.length==0) { return; }
            var newWidth = parseInt(event.target.value);
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.visualsController.editWidth(pentimento.state.selection, newWidth);
            um.endHierarchy(ActionGroups.EditGroup);
            updateVisuals(false);
            drawThumbnails(1000,1);
            $('.edit-tool[data-toolname="width"]').val('');
            break;
        case 'delete-slide':
            if(pentimento.timeController.isRecording()) { return; }
            um.startHierarchy(ActionGroups.EditGroup);
            pentimento.lectureController.deleteSlide(pentimento.state.currentSlide);
            um.endHierarchy(ActionGroups.EditGroup);
            // pentimento.timeController.updateTime(t);
            updateVisuals(false);
            drawThumbnails(1000,1);
        case 'rewind':
            break;
    	case 'pan':
    		break;
        case 'undo':
            break;
        case 'redo':
            break;
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

function recordingToolHandler(event) {
    var elt = $(event.target);
    pentimento.state.selection  = [];
    updateVisuals(false); //clear any selection when switching modes
    if (elt.attr('data-toolname')==='begin') {
        pentimento.state.recordingType = RecordingTypes.VideoOnly; //will have to change for realz when audio comes into play
        pentimento.recordingController.beginRecording();
        $('input[data-toolname="pen"]').click();
    } else {
        pentimento.recordingController.stopRecording();
        pentimento.state.tool = null;
        pentimento.state.recordingType = null;
    }
    $('.recording-tool').toggleClass('hidden');
}

function umToolHandler(event) {
    var elt = $(event.target);
    if(elt.prop('disabled')=='disabled') {
        return;
    } else if(elt.attr('data-toolname')=='undo' && elt.hasClass('edit-tool')) {
        if(pentimento.timeController.isRecording()) { return; }
        var group = $(this).attr('data-group');
        um.undoHierarchy(group);
        updateVisuals(false);
        drawThumbnails(1000,1);
    } else if(elt.attr('data-toolname')=='undo' && elt.hasClass('lecture-tool')) {
        if(!pentimento.timeController.isRecording()) { return; }
        var group = $(this).attr('data-group');
        um.undoHierarchy(group);
        updateVisuals(false);
        drawThumbnails(1000,1);
    } else if(elt.attr('data-toolname')=='redo' && elt.hasClass('edit-tool')) {
        if(pentimento.timeController.isRecording()) { return; }
        var group = $(this).attr('data-group');
        um.redoHierarchy(group);
        updateVisuals(false);
    } else if (elt.attr('data-toolname')=='redo' && elt.hasClass('lecture-tool')) {
        if(!pentimento.timeController.isRecording()) { return; }
        var group = $(this).attr('data-group');
        um.redoHierarchy(group);
        updateVisuals(false);
        drawThumbnails(1000,1);
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
