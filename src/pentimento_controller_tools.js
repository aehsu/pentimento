function lectureToolHandler(event) {
    event.stopPropagation(); 
    var tool = $(event.target).attr('data-toolname');
    clearPreviousHandlers();
    pentimento.state.tool = tool;

    switch(tool) {
    	case 'pen':
            //all timing is done inside of these handlers
            pentimento.state.canvas.on('mousedown', penMouseDown);
            pentimento.state.canvas.on('mousemove', penMouseMove);
            $(window).on('mouseup', penMouseUp);
            break;
        case 'highlight':
            pentimento.state.canvas.on('mousedown', penMouseDown);
            pentimento.state.canvas.on('mousemove', penMouseMove);
            $(window).on('mouseup', highlightMouseUp);
            break;
    	case 'dots':
    		break;
        case 'add-slide':
            if(pentimento.state.isRecording) {
                pentimento.recordingController.addSlide();
                pentimento.lectureController.visualsController.updateVisuals();
            }
            break;
    	case 'color':
    		break;
    	case 'width':
            pentimento.state.width = parseInt($(this).val());
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
    		console.log(this);
    }
}

function editToolHandler(event) {
    var tool = $(event.target).attr('data-toolname');
    clearPreviousHandlers();
    pentimento.state.tool = tool;
    
    var interval;
    switch(tool) {
    	case 'play':
            interval = setInterval(function() {
                if(pentimento.state.videoCursor + INTERVAL_TIMING <= pentimento.lecture_controller.get_lecture_duration()) {
                    pentimento.timeController.updateTime(pentimento.state.videoCursor+INTERVAL_TIMING);
                    //pentimento.visuals_controller.updateVisuals();
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
        $('input[data-toolname="pen"]').click();
        pentimento.recordingController.beginRecording();
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
    $('.live-tool').click(lectureToolHandler);
    $('.live-tool').change(lectureToolHandler);

    $('.nonlive-tool').click(editToolHandler);
    $('.forever-tool').click(foreverToolHandler);
    $('.recording-tool').click(recordingToolHandler);
})
