function initialize_uiux_controller() {
    pentimento.state.canvas = $('#sketchpad'); //local definition to the controller
    pentimento.state.is_recording = false;
    pentimento.state.lmb_down = false; //move this to controller? very local.
    pentimento.state.last_point = null; //move this to controller? very local.
    pentimento.state.color = '#777';
    pentimento.state.width = 2;
    pentimento.state.context = pentimento.state.canvas[0].getContext('2d'); //move this to controller? very local.
    pentimento.state.pressure = false;
    pentimento.state.pressure_color = false;
    pentimento.state.pressure_width = false;

    this.draw_point = function(coord) { //PORTED
        var ctx = pentimento.state.context;
        ctx.beginPath();
        ctx.fillStyle = default_point_color;
        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
    }

    if (ie10_tablet_pointer()) {
        console.log('Pointer Enabled Device');
        //canvas = new smart_paint_widget(canvas_id);
        pentimento.state.pressure = true;
        pentimento.state.pressure_color = true;
        pentimento.state.pressure_width = true;

        var c = pentimento.state.canvas[0];
        c.addEventListener("MSPointerUp", on_mouseup, false);
        c.addEventListener("MSPointerMove", on_mousemove, false);
        c.addEventListener("MSPointerDown", on_mousedown, false);
    } else {
        console.log('Pointer Disabled Device');
        pentimento.state.pressure = false;
        pentimento.state.pressure_color = false;
        pentimento.state.pressure_width = false;
        //canvas = new paint_widget(canvas_id);
        pentimento.state.canvas.mousedown(on_mousedown);
        pentimento.state.canvas.mousemove(on_mousemove);
        $(window).mouseup(on_mouseup);
    }


    /* PORTED
     //ignore touch events for now
     canvas = $("#canv")[0]
     canvas.addEventListener('touchstart', on_mousedown, false);
     canvas.addEventListener('touchmove', on_mousemove, false);
     window.addEventListener('touchend', on_mouseup, false);
     */

    this.clear = function() { //PORTED
        var ctx = get_ctx();
        ctx.clearRect(0, 0, $(canvas_id).width(), $(canvas_id).height())
    }

    $('.live-tool').click(function() {
	var tool = $(this).attr('data-tool-name');
	//keep recording and switch tools
     });

    $('.nonlive-tool').click(function() {
	var tool = $(this).attr('data-tool-name');
	//stop recording and switch tools
    });

    $('.recording-tool').click(function(event) {
        var elt = $(event.target);
        if (elt.attr('data-label')==='begin') {
            pentimento.state.is_recording=true;
        } else {
            pentimento.state.is_recording = false;
        }
        $('.recording-tool').toggleClass('hidden');
    });
};//function() {};

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

this.relative_point = function(event){
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
        }, //copy the current properties of the canvas object
        vertices:[]
    }
}

function on_mousedown(event) {
    if (! pentimento.state.is_recording){return;}

    event.preventDefault();
    pentimento.state.lmb_down = true;
    //console.log('mousedown')

    pentimento.state.current_visual = empty_visual();
    pentimento.state.current_visual.type = 'stroke';//active_visual_type;
    pentimento.state.last_point = relative_point(event);

    pentimento.state.current_visual.vertices.push(pentimento.state.last_point);
    console.log('beginning!');
    console.log(event);
    console.log(pentimento.state.last_point);
    console.log('end beginning');
//    if (active_visual_type == VisualTypes.dots) {
//        canvas.draw_point(last_point);
//    }
    //some checking for which type of tool is currently selected
}
function on_mousemove(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault()

    if (pentimento.state.lmb_down) {
        var cur_point = relative_point(event)
        draw_line({
            from:cur_point,
            to: pentimento.state.last_point,
        });
        console.log('mousemove');
        console.log(event);
        console.log(pentimento.state.last_point);
        console.log(cur_point);
        console.log('end mousemove');
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

        //last_point = cur_point
        pentimento.state.last_point = cur_point;
        pentimento.state.current_visual.vertices.push(cur_point);
        //current_visual.vertices.push(last_point);
    }

}
function on_mouseup(event) {
    if (! pentimento.state.is_recording){return;}
    event.preventDefault();

    if (pentimento.state.lmb_down) {
        pentimento.state.lmb_down = false;
        var visual = pentimento.state.current_visual;
        pentimento.state.current_visual = null;
        pentimento.state.last_point = null;
        return visual;
    }

    //inline = false

    //console.log('mouseup')
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

$(document).ready(function() {
    pentimento.uiux_controller = new initialize_uiux_controller();
    (function() {
        var iw = $(window).width();
        var ih = $(window).height();

        $('#sketchpad')[0].width = 0.9 * iw;
        $('#sketchpad')[0].height = 0.8 * ih;
    })();
})
