
pentimento.uiux_controller = new function() {
    var state = pentimento.state; //reference
    var interval;
    this.stop_recording = function() {
        clearInterval(interval);
        interval = null;
        //some logic to update the slider
        $('#slider').slider("option", {
            disabled: false,
            max: pentimento.lecture_controller.get_lecture_duration()
        });
        update_ticker(state.current_time);
        $('#slider').slider('value', state.current_time);
        state.last_time_update = null;
    }

    function update_ticker(time) {
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
        if(ms==0) {
            ms = '000';
        } else if(ms<10) {
            ms = '00'+ms;
        } else if(ms<100) {
            ms = '0'+ms;
        }

        $('#ticker').val(min + ':' + sec + '.' + ms);
    }

    this.begin_recording = function() {
        $('#slider').slider("option", {
            disabled: true
        });

        interval = setInterval(function() {
            state.current_time += global_time() - state.last_time_update;
            state.last_time_update = global_time();
            update_ticker(state.current_time);
        }, state.interval_timing);
    }

    this.update_time = function(time) { //need to add multi-slide support
        state.current_time = time;
        update_ticker(time);
        $('#slider').slider('value', time);
    }
};

$(document).ready(function() {
    //a lot of this can be moved to just a $(document).ready function...

    pentimento.state.canvas = $('#sketchpad');
    pentimento.state.is_recording = false;
    pentimento.state.lmb_down = false;
    pentimento.state.last_point = null;
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

    $('#slider').slider({
            disabled: true,
            step:1,
            range: 'min',
            slide: function(event, ui) {
                pentimento.uiux_controller.update_time(ui.value);
                update_visuals(ui.value, true);
            },
            stop: function(event, ui) {
                pentimento.uiux_controller.update_time(ui.value);
                update_visuals(pentimento.state.current_time, true);
                pentimento.lecture_controller.set_slide_by_time(ui.value);
            }
        });
    /* PORTED
     //ignore touch events for now
     canvas = $("#canv")[0]
     canvas.addEventListener('touchstart', on_mousedown, false);
     canvas.addEventListener('touchmove', on_mousemove, false);
     window.addEventListener('touchend', on_mouseup, false);
     */
});
