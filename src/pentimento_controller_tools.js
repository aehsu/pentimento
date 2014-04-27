function live_tool_handler(event) {
    event.stopPropagation(); 
    var tool = $(event.target).attr('data-toolname');
    clear_previous_handlers();
    pentimento.state.tool = tool;

    switch(tool) {
    	case 'emphasis':
    		break;
    	case 'pen':
            //all timing is done inside of these handlers
            pentimento.state.canvas.on('mousedown', pen_mousedown);
            pentimento.state.canvas.on('mousemove', pen_mousemove);
            $(window).on('mouseup', pen_mouseup);
            break;
    	case 'dots':
    		break;
        case 'add-slide':
            if(pentimento.state.is_recording) {
                clear();
                pentimento.recording_controller.add_slide();
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

function nonlive_tool_handler(event) {
    var tool = $(event.target).attr('data-toolname');
    clear_previous_handlers();
    pentimento.state.tool = tool;
    
    var interval;
    switch(tool) {
    	case 'play':
            interval = setInterval(function() {
                if(pentimento.state.current_time + INTERVAL_TIMING <= pentimento.lecture_controller.get_lecture_duration()) {
                    pentimento.time_controller.update_time(pentimento.state.current_time+INTERVAL_TIMING);
                    pentimento.visuals_controller.update_visuals(true);
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
            pentimento.visuals_controller.delete_visuals(pentimento.state.selection);
            pentimento.state.selection = [];
            pentimento.visuals_controller.update_visuals(true);
    		break;
    	case 'retime':
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(select_mousedown);
            pentimento.state.canvas.mousemove(select_mousemove);
            $(window).mouseup(select_mouseup);
            break;
        case 'redraw':
            var shifts = pentimento.visuals_controller.delete_visuals(pentimento.state.selection);
            pentimento.time_controller.update_time(shifts[0].tMin);
            $('.recording-tool:not(.hidden)').click();
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

function recording_tool_handler(event) {
    var elt = $(event.target);
    if (elt.attr('data-label')==='begin') {
        $('button[data-toolname="pen"]').click();
        pentimento.recording_controller.begin_recording();
    } else {
        pentimento.recording_controller.stop_recording();
    }
    $('.recording-tool').toggleClass('hidden');
    $('.live-tool').toggleClass('hidden');
    $('.nonlive-tool').toggleClass('hidden');
}

function forever_tool_handler(event) {
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
    $('.live-tool').click(live_tool_handler);
    $('.live-tool').change(live_tool_handler);
    $('.live-tool').addClass('hidden');

    $('.nonlive-tool').click(nonlive_tool_handler);
    $('.forever-tool').click(forever_tool_handler);
    $('.recording-tool').click(recording_tool_handler);
})
