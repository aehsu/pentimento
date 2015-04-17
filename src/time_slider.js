'use strict';

var TimeSliderController = function() {
    var self = this;
    var sliderID = "slider";
    var tickerID = "ticker";

    this.updateTimeCallback = function(currentTime) {
        updateTicker(currentTime);
        updateSlider(currentTime);
    };

    this.beginRecording = function(currentTime) {
        updateTicker(currentTime);
        updateSlider(currentTime);

        // Disable the slider during recording
        $('#'+sliderID).slider("option", {
            disabled: true
        });
    };

    this.endRecording = function(currentTime) {
        updateTicker(currentTime);
        updateSlider(currentTime);

        // Reenable the slider after recording is over
        $('#'+sliderID).slider("option", {
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

        $('#'+tickerID).val(min + ':' + sec + '.' + ms);
    };

    // Updates the slider to dislay the position of the given time
    var updateSlider = function(time) {
        var lectureDuration = lectureController.getLectureModel().getLectureDuration();

        $('#'+sliderID).slider('option', {
            max: lectureDuration
        });
        $('#'+sliderID).slider('value', Math.min(lectureDuration, time));
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    $('#'+sliderID).width($('canvas').width());
    $('#'+tickerID).css('position', 'absolute');
    $('#'+tickerID).css('left', parseInt($('#'+sliderID).width())+20 + 'px');
    $('#'+tickerID).css('top', parseInt($('#'+sliderID).position().top)-10 + 'px');

    // Initialize the slider functionality
    // Updates the time controller when sliding
    $('#'+sliderID).slider({
        disabled: true,
        step:1,
        range: 'min',
        slide: function(event, ui) {
            var time = ui.value;
            lectureController.getTimeController().updateTime(time);
        }
    });

    // Register callbacks with the time controller
    lectureController.getTimeController().addUpdateTimeCallback(self.updateTimeCallback);
};
