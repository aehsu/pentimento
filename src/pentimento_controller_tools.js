function live_tool_handler(event) {
    event.stopPropagation(); 
    var tool = $(event.target).attr('data-toolname');
    if(clear_previous_handlers(tool)) {
        pentimento.state.tool = tool;
    }

    switch(tool) {
    	case 'emphasis':
    		break;
    	case 'pen':
            //all timing is done insidie of these handlers
            //could potentially move these things out
		    pentimento.state.canvas.mousedown(pen_mousedown);
            pentimento.state.canvas.mousemove(pen_mousemove);
            $(window).mouseup(function(event) { //TODO FIX THIS TO BE MORE THE SAME.
                if(pentimento.state.lmb_down) {
                    var visual = pen_mouseup(event);
                    pentimento.recording_controller.add_visual(visual);
                }
            }); //could coalesce these
            break;
    	case 'dots':
            pentimento.state.canvas.mousedown(dots_mousedown);
            pentimento.state.canvas.mousemove(dots_mousemove);
            $(window).mouseup(function(event) {
                console.log("MOUSEUPEVENT:");
                console.log(event);
                var visual = dots_mouseup(event);
                pentimento.lecture_controller.add_visual(visual);
            }); //could coalesce these
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
    if(clear_previous_handlers(tool)) {
        pentimento.state.tool = tool;
    }
    var interval;

    switch(tool) {
    	case 'play':
            //code that's also possibly shitty and may not work, but is cleaner
            interval = setInterval(function() { //TODO fix.
                if(pentimento.state.current_time + 95 <= pentimento.lecture_controller.get_lecture_duration()) {
                    update_visuals(pentimento.state.current_time, true);
                    pentimento.uiux_controller.update_time(pentimento.state.current_time);
                    pentimento.state.current_time+=95;
                } else {
                    clearInterval(interval);
                }
            }, 95);
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
            pentimento.lecture_controller.delete_visuals(pentimento.state.selection);
            update_visuals(pentimento.state.current_time, true);
    		break;
    	case 'retime':
    		break;
        case 'select':
            pentimento.state.canvas.mousedown(select_mousedown);
            pentimento.state.canvas.mousemove(select_mousemove);
            $(window).mouseup(select_mouseup);
            break;
        case 'redraw':
            // pentimento.lecture_controller.delete_visuals(pentimento.state.selection);
            // update_visuals(pentimento.state.current_time, true);
            // some manual drawing necessary
            var buffer = [];
            pentimento.state.is_recording = true;
            pentimento.state.canvas.mousedown(pen_mousedown);
            pentimento.state.canvas.mousemove(pen_mousemove);
            $(window).mouseup(function(event) {
                if(pentimento.state.lmb_down) {
                    var visual = pen_mouseup(event);
                    buffer.push(visual);
                }
            });
            var endredraw = $('<button></button>', {text: 'End Redraw'});
            $('body>div:first-child').append(endredraw);
            endredraw.click(function() {
                pentimento.state.is_recording = false;
                endredraw.remove();
                clear();
                pentimento.lecture_controller.redraw_visuals(pentimento.state.selection, buffer);
                pentimento.uiux_controller.stop_recording();
            });
            break;
        case 'rewind':
            pentimento.lecture_controller.rewind();
            pentimento.uiux_controller.update_time(pentimento.state.current_time);
            update_visuals(pentimento.state.current_time, true);
            break;
        case 'full-rewind':
            pentimento.lecture_controller.full_rewind();
            pentimento.uiux_controller.update_time(pentimento.state.current_time);
            update_visuals(pentimento.state.current_time, true);
            break;
    	case 'pan':
    		break;
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

function breaking_tool_handler(event) {
    if (pentimento.state.is_recording != true) {
        console.log('something went wrong. a breaking tool was triggered when not recording');
    }
    event.stopPropagation(); 
    var tool = $(event.target).attr('data-toolname');
    switch(tool) {
        case 'play':
            $('.recording-tool').click();
            $('.nonlive-tool[data-toolname="play"]').click();
            break;
        case 'insert':
            break;
    }
}

$(document).ready(function() {    
    $('.live-tool').click(live_tool_handler);
    $('.live-tool').change(live_tool_handler);
    $('.live-tool').addClass('hidden');

    $('.nonlive-tool').click(nonlive_tool_handler);
    
    $('.recording-tool').click(function(event) {
        var elt = $(event.target);
        if (elt.attr('data-label')==='begin') {
            $('button[data-toolname="pen"]').click();
            pentimento.state.is_recording=true;
            pentimento.recording_controller.do_record();
            pentimento.uiux_controller.begin_recording();
        } else {
            pentimento.state.is_recording = false;
            pentimento.recording_controller.stop_record();
            pentimento.uiux_controller.stop_recording();
            // clear_previous_handlers(null);
        }
        $('.recording-tool').toggleClass('hidden');
        $('.live-tool').toggleClass('hidden');
        $('.nonlive-tool').toggleClass('hidden');
    });
});
