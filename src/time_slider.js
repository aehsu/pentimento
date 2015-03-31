pentimento.time_slider_controller = new function() {

    this.updateTimeCallback = function(time) {
        updateTicker(time);
        updateSlider(time);
        updateCanvas(time);
    };

    this.beginRecordingCallback = function(time) {
        updateTicker(time);
        updateSlider(time);

        // Disable the slider during recording
        $('#slider').slider("option", {
            disabled: true
        });
    };

    this.endRecordingCallback = function(beginTime, endTime) {
        updateTicker(endTime);
        updateSlider(endTime);
        updateCanvas(endTime);

        // Reenable the slider after recording is over
        $('#slider').slider("option", {
            disabled: false,
        });
    };

    // Updates the ticker display indicating the current time as a string
    var updateTicker = function(time) {
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
    };

    // Updates the slider to dislay the position of the given time
    var updateSlider = function(time) {
        var lectureDuration = pentimento.lectureController.getLectureDuration();

        $('#slider').slider('option', {
            max: lectureDuration
        });
        $('#slider').slider('value', Math.min(lectureDuration, time));
    };

    // Update the canvas to display contents at the specified time
    var updateCanvas = function(time) {
        pentimento.state.selection = [];
        pentimento.lectureController.setStateSlide();

        updateVisuals(false);
        // TODO: uncomment
        // drawThumbnails();
    };
};


$(document).ready(function() {
    // Initialize the slider functionality
    // Updates the time controller when sliding
    $('#slider').slider({
        disabled: true,
        step:1,
        range: 'min',
        slide: function(event, ui) {
            var time = ui.value;
            pentimento.timeController.updateTime(time);
        }
    });

    // Register callbacks with the time controller
    pentimento.timeController.addUpdateTimeCallback(pentimento.time_slider_controller.updateTimeCallback);
    pentimento.timeController.addBeginRecordingCallback(pentimento.time_slider_controller.beginRecordingCallback);
    pentimento.timeController.addEndRecordingCallback(pentimento.time_slider_controller.endRecordingCallback);
});
