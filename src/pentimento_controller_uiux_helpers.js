// Returns true if this Internet Explorer 10 or greater, running on a device
// with msPointer events enabled (like the ms surface pro)
function ie10_tablet_pointer() {
    var ie10 = /MSIE (\d+)/.exec(navigator.userAgent);

    if (ie10 != null) {
        var version = parseInt(ie10[1]);
        if (version >= 10) {
            ie10 = true;
        } else {
            ie10 = false;
        }
    } else {
        ie10 = false;
    }

    var pointer = navigator.msPointerEnabled ? true : false;

    if (ie10 && pointer) {
        return true;
    } else {
        return false;
    }
}

// Returns the location of the event on the canvas, as opposed to on the page
function get_canvas_point(event){
    var pt = {
        x: event.pageX - pentimento.state.canvas.offset().left, // todo fix if canvas not in corner
        y: event.pageY - pentimento.state.canvas.offset().top,
        t: global_time()
    };

    if (pentimento.state.pressure) {
        pt.pressure = event.pressure;
    }

    return pt;
}

// Initializes a dummy visual
function empty_visual(){
    return {
        type: '',
        doesItGetDeleted: false,
        tDeletion: 0,
        tEndEdit: 0,
        tMin: 0,
        properties: {
            'color': pentimento.state.color,
            'width': pentimento.state.width,
        },
        vertices:[]
    }
}

// Handler function for a mousedown on the canvas
function canvas_mousedown(event) {
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

function canvas_mousemove(event) {
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

function canvas_mouseup(event) {
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

function draw_visuals(visuals){ // PORTED
    for (var i=0; i<visuals.length; i++){
        var visual = visuals[i];
        
        if (visual.type == VisualTypes.dots){
            for(var j=0; j<visual.vertices.length; j++){
                var vertex = visual.vertices[j]
                canvas.draw_point(vertex)
            }   
        } else if(visual.type == VisualTypes.stroke){
            for(var j=1; j<visual.vertices.length; j++){
                var from = visual.vertices[j-1]
                var to = visual.vertices[j]
                var line = {
                    from: from,
                    to: to,
                    properties: visual.properties
                };  
                canvas.draw_line(line);
            }   
        } else {
            console.log('unknown visual type');
        }   
    }   
}

function draw_visual(visual) { //PORTED
    if (visual.type == VisualTypes.dots) {
        for(var j=0; j<visual.vertices.length; j++) {
            var vertex = visual.vertices[j];
            canvas.draw_point(vertex);
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
            canvas.draw_line(line);
        }   
    }   
}
