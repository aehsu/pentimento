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
        //t: global_time()
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
