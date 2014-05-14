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

function editToolHandler(tool, event) {
    var interval;
    switch(tool) {
    	case 'play':
            interval = setInterval(function() {
                if(pentimento.state.videoCursor + INTERVAL_TIMING <= pentimento.lecture_controller.get_lecture_duration()) {
                    pentimento.timeController.updateTime(pentimento.state.videoCursor+INTERVAL_TIMING);
                    updateVisuals();
                } else {
                    clearInterval(interval);
                }
            }, INTERVAL_TIMING);
            $('input[data-toolname="play"]').toggleClass('hidden');
            $('input[data-toolname="stop"]').toggleClass('hidden');
    		break;
    	case 'stop':
            clearInterval(interval); //scoping issue for interval
    		break;
    	case 'hyperlink':
    		break;
    	case 'insert-pic-vid-page':
    		break;
    	case 'selection':
    		break;
    	case 'record':
    		break;
    	case 'record-stop':
    		break;
    	case 'color':
    		break;
    	case 'width':
    		break;
    	case 'delete':
            pentimento.lectureController.visualsController.deleteVisuals(pentimento.state.currentSlide, pentimento.state.selection);
            pentimento.state.selection = [];
    		break;
    	case 'retime':
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(selectMouseDown);
            pentimento.state.canvas.mousemove(selectMouseMove);
            $(window).mouseup(selectMouseUp);
            pentimento.state.tool = tool;
            break;
        case 'redraw':
            pentimento.recording_controller.beginRedrawing();
            $('.recording-tool').toggleClass('hidden');
            $('button[data-toolname="pen"]').click();
            break;
        case 'rewind':
            break;
        case 'full-rewind':
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
    if (elt.attr('data-label')==='begin') {
        pentimento.recordingController.beginRecording();
        $('input[data-toolname="pen"]').click();
    } else {
        pentimento.recordingController.stopRecording();
    }
    $('.recording-tool').toggleClass('hidden');
}

function foreverToolHandler(event) {
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
    $('.forever-tool').click(foreverToolHandler);
    $('.recording-tool').click(recordingToolHandler);
})