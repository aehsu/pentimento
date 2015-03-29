pentimento.timeController = new function() {
    var self = this;
    var state = pentimento.state; //reference
    var interval;
    var lastTimeUpdate;

    // Updates audio and video time
    // Updates specific to either the audio or visuals should be updated in their respective functions.
    this.updateTime = function(time) {

        // Updates video time only when video is active
        if (type==RecordingTypes.VideoOnly || type==RecordingTypes.AudioVideo) {
            self.updateVideoTime(time);
        };

        // Updates audio time only when audio is active
        if (type==RecordingTypes.AudioOnly || type==RecordingTypes.AudioVideo) {
            self.updateAudioTime(time);
        };
    };
    
    this.stopRecording = function(endTime) {

        clearInterval(interval);
        interval = null;
        
        $('#slider').slider("option", {
            disabled: false,
            max: pentimento.lectureController.getLectureDuration()
        });

        var type = state.recordingType;

        lastTimeUpdate = null;

        var tickerTime = $('#ticker').val();
        console.log('tickerTimeEnd: ' + tickerTime);
        var tickerSplit = tickerTime.split(/[.|:]/g);
        var tickerTimeMS = parseInt(tickerSplit[0])*60000 + parseInt(tickerSplit[1])*1000 + parseInt(tickerSplit[2]);
        // window.retimer_window.$('#thumbnails_div').data('endrecord', tickerTimeMS);

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

        var tickerTime = $('#ticker').val();
        var tickerSplit = tickerTime.split(/[.|:]/g);
        var tickerTimeMS = parseInt(tickerSplit[0])*60000 + parseInt(tickerSplit[1])*1000 + parseInt(tickerSplit[2]);
        // window.retimer_window.$('#thumbnails_div').data('beginrecord', tickerTimeMS);

        $('#slider').slider("option", {
            disabled: true
        });
        
        var type = state.recordingType;
        lastTimeUpdate = beginTime;
        interval = setInterval(function() {
            var gt = globalTime();
            if (type==RecordingTypes.VideoOnly || type==RecordingTypes.AudioVideo) {
                self.updateVideoTime(state.videoCursor + (gt - lastTimeUpdate));

            }
            if (type==RecordingTypes.AudioOnly || type==RecordingTypes.AudioVideo) {
                self.updateAudioTime(state.audioCursor + (gt - lastTimeUpdate));
            }
            lastTimeUpdate = gt;
        }, INTERVAL_TIMING);
    }

    var updateAudioTime = function(timeMilli) {
        pentimento.audioController.updatePlayheadTime(timeMilli);
    }

    var updateVideoTime = function(timeMilli) {
        state.videoCursor = timeMilli;
        updateTicker(timeMilli);
        if(!state.isRecording) {
            $('#slider').slider('option', {
                max: pentimento.lectureController.getLectureDuration()
            });
            $('#slider').slider('value', timeMilli);
            pentimento.lectureController.setStateSlide(state.videoCursor);
        }
        updateVisuals(false);
        // drawThumbnails();
    }
};

$(document).ready(function() {
    $('#slider').slider({
        disabled: true,
        step:1,
        range: 'min',
        slide: function(event, ui) {
            var timeMilli = ui.value;
            pentimento.state.selection = [];
            pentimento.timeController.updateVideoTime(timeMilli);
            pentimento.timeController.updateAudioTime(timeMilli);
            updateVisuals(false);
            // drawThumbnails();
        },
        stop: function(event, ui) {
            var timeMilli = ui.value;
            pentimento.timeController.updateVideoTime(timeMilli);
            updateVisuals(false);
            // drawThumbnails();
            // console.log("autoConstraint");
            // drawAutomaticConstraint(0, 0);
            // console.log("drawing?")
            // var endTime = $('#slider').slider('value');
            // console.log("endtime: " + endTime);
            // drawAutomaticConstraint(endTime, endTime);
            // console.log("DREW IT!");
        }
    });
});
