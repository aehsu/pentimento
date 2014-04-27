pentimento.time_controller = new function() {
    var state = pentimento.state; //reference
    var interval;
    this.stop_recording = function() {
        clearInterval(interval);
        interval = null;
        
        $('#slider').slider("option", {
            disabled: false,
            max: pentimento.lecture_controller.get_lecture_duration()
        });
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
            var gt = global_time();
            if(!state.last_time_update) { state.last_time_update = gt; }
            update_ticker(state.current_time + gt - state.last_time_update);
        }, INTERVAL_TIMING);
    }

    this.update_time = function(time) {
        state.current_time = time;
        update_ticker(time);
        $('#slider').slider('value', time);
        pentimento.lecture_controller.set_state_slide(state.current_time);
    }
    
    this.rewind = function() {
        //TODO
    }

    this.full_rewind = function() {
        //TODO
    }
};

$(document).ready(function() {
    $('#slider').slider({
        disabled: true,
        step:1,
        range: 'min',
        slide: function(event, ui) {
            pentimento.state.selection = [];
            pentimento.time_controller.update_time(ui.value);
            pentimento.lecture_controller.visuals_controller.update_visuals(true);
        },
        stop: function(event, ui) {
            pentimento.time_controller.update_time(ui.value);
            pentimento.lecture_controller.visuals_controller.update_visuals(true);
        }
    });
});
