function live_tool_handler(event) {
    //event.stopImmediatePropagation(); difference?!
    event.stopPropagation(); 
    //console.log('EVENT: ');
    //console.log(event);
    var tool = $(event.target).attr('data-toolname');
    //keep recording and switch tools
    //might need to do different clearings of events
    clear_previous_handlers(tool);

    switch(tool) {
    	case 'emphasis':
    		break;
    	case 'pen':
            //all timing is done insidie of these handlers
            //could potentially move these things out
		    pentimento.state.canvas.mousedown(pen_mousedown);
            pentimento.state.canvas.mousemove(pen_mousemove);
    		//var visual = $(window).mouseup(pen_mouseup);
            $(window).mouseup(function(event) {
                console.log("MOUSEUPEVENT:");
                //console.log(event);
                var visual = pen_mouseup(event);
                pentimento.lecture_controller.add_visual(visual);
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
    	case 'shape':
    		break;
    	case 'color':
    		break;
    	case 'width':
    		break;
    	case 'delete':
    		break;
    	case 'pan':
    		break;
    	case 'clear':
		    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
    		break;
    	default:
		    pentimento.state.tool = null;
    		console.log('Unrecognized tool clicked, live tools');
    		console.log(this);
    }
    pentimento.state.tool = tool;
}

function nonlive_tool_handler(event) {
    switch(tool) {
    	case 'play':
    		break;
    	case 'play-stop':
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
    		break;
    	case 'retime':
    		break;
    	case 'redraw':
    		break;
    	case 'insert':
            pentimento.state.is_recording = false;
            pentimento.state.lmb_down = false; //necessary?
            /*
                get the current time of the lecture.
                begin recording
                end recording
                insert into original lecture.
                shift everything by appropriate amount
            */
    		break;
    	case 'pan':
    		break;
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

$(document).ready(function() {
    $('.live-tool').click(live_tool_handler);    

    $('.nonlive-tool').click(nonlive_tool_handler);
    
    $('.recording-tool').click(function(event) {
        var elt = $(event.target);
        if (elt.attr('data-label')==='begin') {
            if(!pentimento.state.tool) {
                //console.log('pentimento state tool pre- something');
                $('button[data-toolname="pen"]').click();
                //console.log('pentimento state tool post- something');
            }
            pentimento.state.is_recording=true;
        } else {
            pentimento.state.is_recording = false;
        }
        $('.recording-tool').toggleClass('hidden');
    });
});
