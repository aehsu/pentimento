function initialize_uiux_controller() {
	this.canvas = $('#sketchpad');
	pentimento.state.is_recording = false;
	pentimento.state.lmb_down = false; //move this to controller? very local.
	pentimento.state.last_point = null; //move this to controller? very local.
	pentimento.state.color = '#777';
	pentimento.state.width = 2;
    pentimento.state.context = this.canvas[0].getContext('2d'); //move this to controller? very local.
    pentimento.state.pressure = false;
    pentimento.state.pressure_color = false;
    pentimento.state.pressure_width = false;

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

    this.draw_line = function(line) {
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

    this.draw_point = function(coord) { //PORTED
        var ctx = get_ctx()
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

        var c = document.getElementById(canvas_dom_id);
        c.addEventListener("MSPointerUp", on_mouseup, false);
        c.addEventListener("MSPointerMove", on_mousemove, false);
        c.addEventListener("MSPointerDown", on_mousedown, false);
    } else {
        console.log('Pointer Disabled Device');
        pentimento.state.pressure = false;
        pentimento.state.pressure_color = false;
        pentimento.state.pressure_width = false;
        //canvas = new paint_widget(canvas_id);
        $(canvas_id).mousedown(on_mousedown);
        $(canvas_id).mousemove(on_mousemove);
        $(window).mouseup(on_mouseup);
    }

    this.relative_point = function(event){
        var pt = {
            x: event.pageX - $(canvas_id).offset().left, // todo fix if canvas not in corner
            y: event.pageY - $(canvas_id).offset().top,
            t: global_time()
        };
        if (pentimento.state.pressure) {
            pt.pressure = event.pressure;
        }

        return pt;
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

function on_mousedown(event) {
    if (! enabled){return;}

    event.preventDefault();
    lmb_down = true;
    //console.log('mousedown')

    current_visual = empty_visual();
    current_visual.type = active_visual_type;
    last_point = canvas.relative_point(event);

    current_visual.vertices.push(last_point);

    if (active_visual_type == VisualTypes.dots) {
        canvas.draw_point(last_point);
    }

}
function on_mousemove(event) {
    if (! enabled){return;}
    event.preventDefault()

    if (lmb_down) {
        var cur_point = canvas.relative_point(event)

        if (active_visual_type == VisualTypes.dots) {
            canvas.draw_point(cur_point);
        }
        else if (active_visual_type == VisualTypes.stroke) {
            canvas.draw_line({
                    from: cur_point,
                    to: last_point,
                    properties: current_visual.properties
            });
        }
        else {
            console.log("unknown drawing mode");
        }

        last_point = cur_point;
        current_visual.vertices.push(last_point);
    }

}
function on_mouseup(event) {
    if (! enabled){return;}
    event.preventDefault();

    if (lmb_down) {
        lmb_down = false;
        return current_visual;
    }

    //inline = false

    //console.log('mouseup')
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

        $(canvas_id)[0].width = 0.9 * iw
        $(canvas_id)[0].height = 0.8 * ih
    })();
})