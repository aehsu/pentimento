$(document).ready(function() {
    //pentimento.uiux_controller = new function() { //keeps state and visuals in line with each other
        //a lot of this can be moved to just a $(document).ready function...
        pentimento.state.canvas = $('#sketchpad'); //local definition to the controller
        pentimento.state.is_recording = false; //WHY IS THIS HERE?!?!
        pentimento.state.lmb_down = false; //move this to controller? very local.
        pentimento.state.last_point = null; //move this to controller? very local.
        pentimento.state.color = '#777';
        pentimento.state.width = 2;
        pentimento.state.context = pentimento.state.canvas[0].getContext('2d'); //move this to controller? very local.
        pentimento.state.pressure = false;
        pentimento.state.pressure_color = false;
        pentimento.state.pressure_width = false;

        if (ie10_tablet_pointer()) {
            console.log('Pointer Enabled Device');
            pentimento.state.pressure = true;
            pentimento.state.pressure_color = true;
            pentimento.state.pressure_width = true;

        //why is this different?!
            //var c = pentimento.state.canvas[0];
            //c.addEventListener("MSPointerUp", canvas_mouseup, false);
            //c.addEventListener("MSPointerMove", canvas_mousemove, false);
            //c.addEventListener("MSPointerDown", canvas_mousedown, false);
        } else {
            console.log('Pointer Disabled Device');
            pentimento.state.pressure = false;
            pentimento.state.pressure_color = false;
            pentimento.state.pressure_width = false;
            //pentimento.state.canvas.mousedown(canvas_mousedown);
            //pentimento.state.canvas.mousemove(canvas_mousemove);
            //$(window).mouseup(canvas_mouseup);
        }

        /* PORTED
         //ignore touch events for now
         canvas = $("#canv")[0]
         canvas.addEventListener('touchstart', on_mousedown, false);
         canvas.addEventListener('touchmove', on_mousemove, false);
         window.addEventListener('touchend', on_mouseup, false);
         */

    //};
});

pentimento.uiux_controller = new function() {
    var state = pentimento.state; //reference
    var interval;
    this.stop_recording = function() {
        clearInterval(interval);
        interval = null;
        //some logic to update the slider
    }

    this.begin_recording = function() {
        interval = setInterval(function() { //maybe could be faster if just subtract.
            var time = state.current_time;
            var min = Math.floor(time/60000);
            time -= min*60000;
            var sec = Math.floor(time/1000);
            //time -= sec*1000;
            var ms = time % 1000; //same as subtracting.
            if(min==0) {
                min = '00';
            } else if(min<10){
                min = '0'+min;
            }
            if(sec==0){
                sec = '00';
            } else if(sec<10) {
                sec = '0'+sec;
            }

            $('#ticker').val(min + ':' + sec + '.' + ms);
        }, state.interval_timing);
    }
};