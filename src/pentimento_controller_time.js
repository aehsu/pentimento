pentimento.timeController = new function() {
    var state = pentimento.state; //reference
    var self = this;
    var interval;
    var lastTimeUpdate;
    
    this.stopRecording = function(endTime) {
        clearInterval(interval);
        interval = null;
        
        $('#slider').slider("option", {
            disabled: false,
            max: pentimento.lectureController.getLectureDuration()
        });
        var type = state.recordingType;
        if (type==RecordingTypes.VideoOnly || type==RecordingTypes.AudioVideo) {
            self.updateVideoTime(state.videoCursor + (endTime - lastTimeUpdate));
            updateVisuals();
        }
        if (type==RecordingTypes.AudioOnly || type==RecordingTypes.AudioVideo) { self.updateAudioTime(state.videoCursor + (endTime - lastTimeUpdate)); }
        lastTimeUpdate = null;
    }

    function updateTicker(time) {
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

    this.beginRecording = function(beginTime) {
        $('#slider').slider("option", {
            disabled: true
        });
        
        var type = state.recordingType;
        lastTimeUpdate = beginTime;
        interval = setInterval(function() {
            if(state.isShifting) { return; }
            var gt = globalTime();
            if (type==RecordingTypes.VideoOnly || type==RecordingTypes.AudioVideo) {
                self.updateVideoTime(state.videoCursor + (gt - lastTimeUpdate));
                updateVisuals();
            }
            if (type==RecordingTypes.AudioOnly || type==RecordingTypes.AudioVideo) {
                self.updateAudioTime(state.audioCursor + (gt - lastTimeUpdate));
            }
            lastTimeUpdate = gt;
        }, INTERVAL_TIMING);
    }

    this.updateAudioTime = function(time) {
    }

    this.updateVideoTime = function(time) {
        state.videoCursor = time;
        updateTicker(time);
        if(!state.isRecording) {
            $('#slider').slider('option', {
                max: pentimento.lectureController.getLectureDuration()
            });
            $('#slider').slider('value', time);
            pentimento.lectureController.setStateSlide(state.videoCursor);
        }
    }

    this.refresh = function() {

    }
};

$(document).ready(function() {
    $('#slider').slider({
        disabled: true,
        step:1,
        range: 'min',
        slide: function(event, ui) {
            pentimento.state.selection = [];
            pentimento.timeController.updateVideoTime(ui.value);
            updateVisuals();
        },
        stop: function(event, ui) {
            pentimento.timeController.updateVideoTime(ui.value);
            updateVisuals();
        }
    });
});
