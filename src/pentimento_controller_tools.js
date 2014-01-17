function live_tool_handler(event) {
    //event.stopImmediatePropagation(); difference?!
    event.stopPropagation(); 
    //console.log('EVENT: ');
    //console.log(event);
    var tool = $(event.target).attr('data-toolname');
    //keep recording and switch tools
    //might need to do different clearings of events
    clear_previous_handlers(tool); //need the name of the newly selected tool? should just clear all?

    switch(tool) {
    	case 'emphasis':
    		break;
    	case 'pen':
            //all timing is done insidie of these handlers
            //could potentially move these things out
		    pentimento.state.canvas.mousedown(pen_mousedown);
            pentimento.state.canvas.mousemove(pen_mousemove); //
    		//var visual = $(window).mouseup(pen_mouseup);
            $(window).mouseup(function(event) { //TODO FIX THIS TO BE MORE THE SAME.
                //console.log("MOUSEUPEVENT:");
                //console.log(event);
                if(pentimento.state.lmb_down) {
                    var visual = pen_mouseup(event);
                    pentimento.lecture_controller.add_visual(visual);
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
    var tool = $(event.target).attr('data-toolname');

    switch(tool) {
    	case 'play':
            pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
            var slide_idx = 0;
            var slide;
            var time;
            var visuals;
            var visuals_idx;
            var visual;
            while(slide_idx<pentimento.lecture_controller.get_slides_length()) {
                slide = pentimento.lecture_controller.get_slide(slide_idx);
                visuals = slide.visuals;
                time = 0;
                visuals_idx=0;
                while(time < slide.duration) {
                    var begin_time = 0;
                    for(var i=0; i<slide_idx; i++) {
                        begin_time += pentimento.lecture_controller.get_slide(i).duration;
                    }
                    while((visuals_idx<visuals.length) && (visuals[visuals_idx].tMin - begin_time < time)) {
                        (function() { //this is the worst. but actually. TODO GET THIS OUT
                            //var timing = 500;
                            var visual = visuals[visuals_idx];
                            setTimeout(function() {
                                draw_visual(visual);
                            }, 500+visuals_idx*100)
                        })();
                        //draw_visual(visuals[visuals_idx]);
                        visuals_idx++;
                    }
                    time+=100;//ms
                }
                slide_idx++;
            }
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
        case 'rewind':

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

    $('.nonlive-tool').click(nonlive_tool_handler);
    
    $('.recording-tool').click(function(event) {
        var elt = $(event.target);
        if (elt.attr('data-label')==='begin') {
            pentimento.state.is_recording=true;
            if(!pentimento.state.tool) {
                //console.log('pentimento state tool pre- something');
                $('button[data-toolname="pen"]').click();
                //console.log('pentimento state tool post- something');
            }
            pentimento.lecture_controller.begin_recording();
            pentimento.uiux_controller.begin_recording();
        } else {
            pentimento.state.is_recording = false;
            pentimento.lecture_controller.stop_recording();
            pentimento.uiux_controller.stop_recording();
            clear_previous_handlers(null);
        }
        $('.recording-tool').toggleClass('hidden');
    });
});
