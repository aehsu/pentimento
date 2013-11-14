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
        pentimento.state.pressure = true;
        pentimento.state.pressure_color = true;
        pentimento.state.pressure_width = true;

	//why is this different?!
        var c = pentimento.state.canvas[0];
        c.addEventListener("MSPointerUp", canvas_mouseup, false);
        c.addEventListener("MSPointerMove", canvas_mousemove, false);
        c.addEventListener("MSPointerDown", canvas_mousedown, false);
    } else {
        console.log('Pointer Disabled Device');
        pentimento.state.pressure = false;
        pentimento.state.pressure_color = false;
        pentimento.state.pressure_width = false;
        pentimento.state.canvas.mousedown(canvas_mousedown);
        pentimento.state.canvas.mousemove(canvas_mousemove);
        $(window).mouseup(canvas_mouseup);
    }

    /* PORTED
     //ignore touch events for now
     canvas = $("#canv")[0]
     canvas.addEventListener('touchstart', on_mousedown, false);
     canvas.addEventListener('touchmove', on_mousemove, false);
     window.addEventListener('touchend', on_mouseup, false);
     */

};//function() {};

$(document).ready(function() {
    pentimento.uiux_controller = new initialize_uiux_controller();

    var iw = $(window).width();
    var ih = $(window).height();
    $('#sketchpad')[0].width = 0.9 * iw;
    $('#sketchpad')[0].height = 0.8 * ih;
});
