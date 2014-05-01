pentimento.time_controller = new function() {
    var state = pentimento.state; //reference
    var self = this;
    var interval;
    var stop_interval;
    var last_time_update;
    
    this.stop_recording = function(end_time) {
        clearInterval(interval);
        interval = null;
        
        $('#slider').slider("option", {
            disabled: false,
            max: pentimento.lecture_controller.get_lecture_duration()
        });
        self.update_time(state.current_time + (end_time - last_time_update));
        last_time_update = null;
//        $('#slider').slider('value', state.current_time);
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

    this.begin_recording = function(begin_time) {
        $('#slider').slider("option", {
            disabled: true
        });
        
        last_time_update = begin_time;
        interval = setInterval(function() {
            var gt = global_time();
            self.update_time(state.current_time + (gt - last_time_update));
            last_time_update = gt;
        }, INTERVAL_TIMING);
    }

    this.update_time = function(time) {
        state.current_time = time;
        update_ticker(time);
        if(!state.is_recording) {
            $('#slider').slider('value', time);
            pentimento.lecture_controller.set_state_slide(state.current_time);
        }
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
            pentimento.lecture_controller.visuals_controller.updateVisuals();
        },
        stop: function(event, ui) {
            pentimento.time_controller.update_time(ui.value);
            pentimento.lecture_controller.visuals_controller.updateVisuals();
        }
    });
});
