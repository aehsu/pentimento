function draw_line(line) {
    var ctx = pentimento.state.context;
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
        ctx.strokeStyle = pentimento.state.color;
        ctx.lineWidth = pentimento.state.width;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function clear_previous_handlers(new_tool) {
    var benign = ['clear', 'color', 'width'];

    if ($.inArray(new_tool, benign) > -1) {
        return;
    } else {
        //clear some handlers
        console.log('gotta clear some handlers correctly. maybe switch statement;');
        pentimento.state.canvas.off('mousedown');
        pentimento.state.canvas.off('mousemove');
        $(window).off('mouseup');
    }
}

// Handler function for a mousedown on the canvas
function pen_mousedown(event) {
    if (! pentimento.state.is_recording){return;}
    var state = pentimento.state; //reference

    event.preventDefault();
    state.lmb_down = true;

    state.current_visual = empty_visual();
    state.current_visual.type = 'stroke';//active_visual_type; have to do something based on the current tool
    state.last_point = get_canvas_point(event);

    state.current_visual.vertices.push(state.last_point);
//    if (active_visual_type == VisualTypes.dots) {
//        canvas.draw_point(last_point);
//    }
    //some checking for which type of tool is currently selected
}

function pen_mousemove(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault()
    
    var state = pentimento.state; //reference
    if (state.lmb_down) {
        var cur_point = get_canvas_point(event);
        draw_line({
            from: state.last_point,
            to: cur_point,
        });
        //if (active_visual_type == VisualTypes.dots) {
        //    canvas.draw_point(cur_point);
        //}
        //else if (active_visual_type == VisualTypes.stroke) {
        //    canvas.draw_line({
        //            from: cur_point,
        //            to: last_point,
        //            properties: current_visual.properties
        //    });
        //}
        //else {
        //    console.log("unknown drawing mode");
        //} 
        
        state.last_point = cur_point;
        state.current_visual.vertices.push(cur_point);
    }
}

function pen_mouseup(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();

    var state = pentimento.state;
    if (state.lmb_down) {
        state.lmb_down = false;
        var visual = state.current_visual;
        state.current_visual = null;
        state.last_point = null;
        return visual;
    }
}

// Handler function for a mousedown on the canvas
function dots_mousedown(event) {
    if (! pentimento.state.is_recording){return;}
    var state = pentimento.state; //reference

    event.preventDefault();
    state.lmb_down = true;

    state.current_visual = empty_visual();
    state.current_visual.type = 'dots';//active_visual_type; have to do something based on the current tool
    state.last_point = get_canvas_point(event);

    state.current_visual.vertices.push(state.last_point);

    //draw_point
    var ctx = pentimento.state.context;
    ctx.beginPath();
    ctx.fillStyle = state.color;
    ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);

    //some checking for which type of tool is currently selected
}

function dots_mousemove(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault()
    
    var state = pentimento.state; //reference
    if (state.lmb_down) {
        var cur_point = get_canvas_point(event);
        //draw_point
        var ctx = pentimento.state.context;
        ctx.beginPath();
        ctx.fillStyle = state.color;
        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
        
        state.last_point = cur_point;
        state.current_visual.vertices.push(cur_point);
    }
}

function dots_mouseup(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();

    var state = pentimento.state;
    if (state.lmb_down) {
        state.lmb_down = false;
        var visual = state.current_visual;
        state.current_visual = null;
        state.last_point = null;
        return visual;
    }
}