var VisualTypes = {
    stroke: 'stroke',
    dots: 'dots',
};

function draw_point(coord) { //PORTED
    var ctx = pentimento.state.context;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    // ctx.fillStyle = default_point_color;
    ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
}

function draw_line(line) {
    var ctx = pentimento.state.context;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(line.from.x, line.from.y);
    ctx.lineTo(line.to.x, line.to.y);

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
        if(line.properties) {
            ctx.strokeStyle = line.properties.color;
            ctx.lineWidth = line.properties.width;
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
    var pt = {
        x: event.pageX - pentimento.state.canvas.offset().left, // todo fix if canvas not in corner
        y: event.pageY - pentimento.state.canvas.offset().top,
    };

    if (pentimento.state.pressure) {
        pt.pressure = event.pressure;
    }

    return pt;
}

// Initializes a dummy visual
function empty_visual(){
    return {
        type: null,
        doesItGetDeleted: null,
        tDeletion: null,
        tEndEdit: null,
        tMin: global_time() - pentimento.state.current_slide.last_start,
        properties: {
            'color': pentimento.state.color,
            'width': pentimento.state.width,
        },
        vertices:[]
    }
}

function draw_visual(visual) {
    if (visual.type == VisualTypes.dots) {
        for(var j=0; j<visual.vertices.length; j++) {
            var vertex = visual.vertices[j];
            draw_point(vertex);
        }   
    } else if(visual.type == VisualTypes.stroke) {
        for(var j=1; j<visual.vertices.length; j++){
            var from = visual.vertices[j-1]
            var to = visual.vertices[j]
            var line = {
                from: from,
                to: to,
                properties: visual.properties
            };  
            draw_line(line);
        }   
    } else {
        console.log('unknown visual type');
    }
}

function draw_visuals(visuals){ // PORTED
    for (var i=0; i<visuals.length; i++){
        draw_visual(visuals[i]);
    }
}

function update_visuals(time, doclear) { //just always take for state.current_time? //need to change to support multiple slides?
    if(doclear) {
        clear();
    }
    var visuals = [];
    var running_time = 0;
    var slide;
    for(var i=0; i<pentimento.lecture_controller.get_slides_length(); i++) {
        slide = pentimento.lecture_controller.get_slide(i)
        if(running_time + slide.duration < time) {
            running_time += slide.duration;
        } else {
            for(visual in slide.visuals) {
                if(slide.visuals[visual].tMin + running_time <= time) {
                    visuals.push(slide.visuals[visual]);
                }
            }
            running_time+= slide.duration;
        }
    }
    draw_visuals(visuals);
}

function clear_previous_handlers(new_tool) {
    var benign = ['clear', 'color', 'width'];

    if ($.inArray(new_tool, benign) > -1) {
        return false;
    } else {
        //clear some handlers
        pentimento.state.canvas.off('mousedown');
        pentimento.state.canvas.off('mousemove');
        $(window).off('mouseup');
        pentimento.state.tool = null;
        return true;
    }
}

function clear() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

/***********************************************************************/
/***********************************************************************/
/***********************************************************************/


// Handler function for a mousedown on the canvas
function pen_mousedown(event) {
    if (! pentimento.state.is_recording){return;}
    var state = pentimento.state; //reference

    event.preventDefault();
    state.lmb_down = true; //FUCK TODO FIX.

    state.current_visual = empty_visual();
    state.current_visual.type = VisualTypes.stroke;//active_visual_type; move to state? update empty visual based on this
    state.last_point = get_canvas_point(event);
    state.last_point['t'] = global_time() - pentimento.state.current_slide.last_start;
    state.current_visual.vertices.push(state.last_point);
}

function pen_mousemove(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();  
    var state = pentimento.state; //reference

    if (state.lmb_down) {
        var cur_point = get_canvas_point(event);
        draw_line({
            from: state.last_point,
            to: cur_point,
        });
        
        state.last_point = cur_point;
        state.last_point['t'] = global_time() - pentimento.state.current_slide.last_start;//can move into get_canvas_point() function.
        state.current_visual.vertices.push(cur_point);
    }
}

function pen_mouseup(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();
    //console.log('pen_mouseup');

    var state = pentimento.state;
    if (state.lmb_down) {
        state.lmb_down = false;
        var visual = state.current_visual;
        state.current_visual = null;
        state.last_point = null;
        return visual; // why need to return?
    }
}

// Handler function for a mousedown on the canvas
function dots_mousedown(event) {
    if (! pentimento.state.is_recording){return;}
    var state = pentimento.state; //reference

    event.preventDefault();
    state.lmb_down = true;

    state.current_visual = empty_visual();
    state.current_visual.type = 'dots';
    var coord = get_canvas_point(event)
    
    state.current_visual.vertices.push(coord);

    //draw_point
    var ctx = pentimento.state.context;
    ctx.beginPath();
    ctx.fillStyle = state.color;
    ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
}

function dots_mousemove(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();
    
    var state = pentimento.state; //reference
    if (state.lmb_down) {
        var coord = get_canvas_point(event);
        var ctx = pentimento.state.context;
        ctx.beginPath();
        ctx.fillStyle = state.color;
        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
        
        state.current_visual.vertices.push(coord);
    }
}

function dots_mouseup(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();
    console.log('dots_mouseup');

    var state = pentimento.state;
    if (state.lmb_down) {
        state.lmb_down = false;
        var visual = state.current_visual;
        state.current_visual = null;
        state.last_point = null;
        return visual;
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