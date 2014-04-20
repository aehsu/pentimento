function draw_point(coord) { //PORTED
    var ctx = pentimento.state.context;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
}

function draw_line(segment) {
    var ctx = pentimento.state.context;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(segment.from.x, segment.from.y);
    ctx.lineTo(segment.to.x, segment.to.y);

    if (pentimento.state.pressure) { //some fancy stuff based on pressure
        /*var avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

        if (pressure_color) {
            var alpha = (1 - 0.5) + 0.5 * avg_pressure
            line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
        }
        else {
            line.color = 'rgba(64,64,64,1)'  // todo use defaults
        }

        if (pressure_width) {
            line.width = 1 + Math.round(max_extra_line_width * avg_pressure) // todo use defaults
        }
        else {
            line.width = 2 // todo use defaults
        }

        canvas.draw_line(line)*/
    } else {
        if(segment.properties) {
            ctx.strokeStyle = segment.properties.color;
            ctx.lineWidth = segment.properties.width;
        } else {
            ctx.strokeStyle = pentimento.state.color;
            ctx.lineWidth = pentimento.state.width;
        }
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}


// Returns the location of the event on the canvas, as opposed to on the page
function get_canvas_point(event){
    var x = event.pageX - pentimento.state.canvas.offset().left;
    var y = event.pageY - pentimento.state.canvas.offset().top;
    var t = global_time();
    
    if(pentimento.state.pressure) {
        return new Vertex(x, y, t, event.pressure);
    } else {
        return new Vertex(x, y, t);
    }
}

function clear_previous_handlers() {
    //clear some handlers
    pentimento.state.canvas.off('mousedown');
    pentimento.state.canvas.off('mousemove');
    $(window).off('mouseup');
    
    //re-attach the necessary ones
    $(pentimento.state.canvas).on('mousedown', mouse_down_handler);
    $(window).on('mouseup', mouse_up_handler);
    $(window).on('keydown', key_down_handler);
    $(window).on('keyup', key_up_handler);
    pentimento.state.tool = null;
}

function clear() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

/***********************************************************************/
/***********************************************************************/
/***********************************************************************/


// Handler function for a mousedown on the canvas
function dots_mousedown(event) {
    //TODO
}

function dots_mousemove(event) {
    //TODO
}

function dots_mouseup(event) {
    //TODO
}

// Handler function for a mousedown on the canvas
function pen_mousedown(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();
    var state = pentimento.state; //reference
    state.current_visual = new StrokeVisual(global_time());
    state.current_visual.properties.color = state.color;
    state.current_visual.properties.width = state.width;
    state.last_point = get_canvas_point(event);
    state.current_visual.vertices.push(state.last_point);
}

function pen_mousemove(event) {
    if (!pentimento.state.is_recording){return;}
    event.preventDefault();  
    var state = pentimento.state; //reference

    if (state.lmb) {
        var cur_point = get_canvas_point(event);
        draw_line(new Segment(state.last_point,cur_point, state.current_visual.properties));
        state.last_point = cur_point;
        state.current_visual.vertices.push(cur_point);
    }
}

function pen_mouseup(event) {
    if (!pentimento.state.is_recording){return;}
    event.preventDefault();

    var state = pentimento.state;
    if(state.current_visual != null && state.current_visual!=undefined) {
        pentimento.recording_controller.add_visual(state.current_visual);
        state.current_visual = null;
        state.last_point = null;
    }
}

function select_mousedown(event) { //non-live handler
    if (pentimento.state.is_recording) {return ;}
    event.preventDefault();
    var state = pentimento.state;

    update_visuals(state.current_time, true);
    state.lmb_down = true;
    state.last_point = get_canvas_point(event);
    state.selection = [];
}

function select_mousemove(event) {
    if (pentimento.state.is_recording||!pentimento.state.lmb_down) {return ;}
    event.preventDefault();
    var state = pentimento.state;

    update_visuals(state.current_time, true);
    var coord = get_canvas_point(event);
    var ctx = state.context;
    var width = state.width;
    var style = state.color;
    ctx.strokeStyle = "#0000FF";
    ctx.lineWidth = 2;
    ctx.strokeRect(state.last_point.x, state.last_point.y, coord.x-state.last_point.x, coord.y-state.last_point.y);
    state.selection = [];

    function determine_inside(state, x_pt, y_pt, coord) {
        if(x_pt >= state.last_point.x && x_pt <= coord.x) {
            if (y_pt>=state.last_point.y && y_pt<=coord.y) {
                return true;
            } else if(y_pt<=state.last_point.y && y_pt>=coord.y) {
                return true;
            }
        } else if(x_pt<=state.last_point.x && x_pt>=coord.x) {
            if (y_pt>=state.last_point.y && y_pt<=coord.y) {
                return true;
            } else if(y_pt<=state.last_point.y && y_pt>=coord.y) {
                return true;
            }
        }
        return false;
    }

    if(!state.current_slide) {
        ctx.strokeStyle = style; // should be valid if you say pentimento.state.color
        ctx.lineWidth = width; // should be valid if you say pentimento.state.width
        return;
    }
    for(vis in state.current_slide.visuals) {
        var visual = state.current_slide.visuals[vis];
        var n_vert = 0;
        for (vert in visual.vertices) {
            var x = visual.vertices[vert].x;
            var y = visual.vertices[vert].y;

            if (determine_inside(state,x,y,coord)) { //check for deletion/appearance.
                n_vert++;
            }
        }
        if(n_vert/visual.vertices.length >= .4) {
            state.selection.push(visual);
        }
    }

    for(vis in state.selection) {
        var vis_copy = $.extend(true, {}, state.selection[vis]);
        vis_copy.properties.width = state.selection[vis].properties.width+1;
        vis_copy.properties.color = "#0000FF";
        draw_visual(vis_copy);
    }

    ctx.strokeStyle = style; // should be valid if you say pentimento.state.color
    ctx.lineWidth = width; // should be valid if you say pentimento.state.width
}

function select_mouseup(event) {
    if (pentimento.state.is_recording) {return ;}
    event.preventDefault();

    var state =  pentimento.state;
    state.lmb_down = false;
    update_visuals(state.current_time, true);
    for(vis in state.selection) {
        var vis_copy = $.extend(true, {}, state.selection[vis]);
        vis_copy.properties.width = state.selection[vis].properties.width+1;
        vis_copy.properties.color = "#0000FF";
        draw_visual(vis_copy);
    }
}

