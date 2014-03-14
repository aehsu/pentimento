pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
	var lecture = null;
	var recording_params;
    var recordRTC = null;
    navigator.getUserMedia({audio: true}, function(mediaStream) {
       recordRTC = RecordRTC(mediaStream, {
            autoWriteToDisk: true
        });
       recordRTC.startRecording();
    });
    var state = pentimento.state;
    
	//move to elsewhere? high level function?
    function slide() {
        this.last_start = null;
        this.visuals = [];
        this.duration = 0;

        this.add_visual = function(visual) {
            this.VISUALS.push(visual);
        }
        this.get_visuals = function() {
            return this.VISUALS;
        }
        this.get_visual_by_index = function(index) {
            return this.VISUALS[index];
        }
        this.insert_visual_at_index = function(visual, index) {

        }
        this.insert_visual_at_time = function(visual, t_audio) { //t_audio, t_visual?

        }
    };

    function slide_change(from_page, to_page, time) {
        this.from_page = from_page;
        this.to_page = to_page;
        this.time = time;
    };

    this.add_slide = function() {
        var gt = global_time();
    	if(lecture.slides.length != 0) {
    		var idx = lecture.slides.indexOf(current_slide);
    		lecture.slide_changes.push(new slide_change(idx, idx+1, gt));
    		end_slide();
    	}
        var new_slide = new slide();
        lecture.slides.push(new_slide);
        state.current_slide = new_slide;
        new_slide.last_start = gt;
    };

    function end_slide() { //jesus save me.
    	state.current_slide.duration += global_time() - state.current_slide.last_start;
    	state.current_slide = null;
    }

    this.add_visual = function(visual) {
        state.current_slide.visuals.push(visual); //change to local????
    };

	this.do_record = function() {
        recording_params = pentimento.lecture_controller.get_recording_params();
		lecture = new pentimento.lecture();
		this.add_slide();
        pentimento.state.last_time_update = global_time();


        // Start the audio recording
        recordRTC.startRecording();
	};

	this.stop_record = function() {
        // Stop the audio recording
        recordRTC.stopRecording(function(audioURL) {
           console.log(audioURL);

            // Insert an audio track if there isn't one yet
            var track = lecture.audio_tracks[0];
            if (typeof track === 'undefined') {
                track = new Audio_track();
                lecture.audio_tracks.push(track);
                pentimento.lecture_controller.create_audio_track(track);
            };

            // Get information about the audio track from looking at the lecture state
            var start_time = pentimento.state.last_time_update;
            var current_time = global_time();
            var audio_duration = current_time - start_time;
            console.log("Recorded audio of length: " + audio_duration);

            // Insert the audio segment into the track
            var segment = new Audio_segment(audioURL, 0, audio_duration, start_time, current_time);
            lecture.audio_tracks.push(segment);
            pentimento.lecture_controller.create_audio_segment(segment);


            // TEMP: Try writing the audio to disk
            saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();

            (function () {
                var eventHandlers = {
                    'play': function () {
                        pentimento.state.wavesurfer.playPause();
                    }
                };

                document.addEventListener('click', function (e) {
                    var action = e.target.dataset && e.target.dataset.action;
                    if (action && action in eventHandlers) {
                        eventHandlers[action](e);
                    }
                });
            }());
        });


        console.log('stop_record function called');
        console.log('recording params value {"current_slide":'+recording_params['current_slide']+', "time_in_slide":'+recording_params['time_in_slide']);
		end_slide();

        console.log('some sanity checking happening');
        if(lecture.slides[0].visuals[0] && lecture.slides[0].visuals[1]) {
            console.log('tMin for first and second visuals:' + lecture.slides[0].visuals[0].tMin + ', ' + lecture.slides[0].visuals[1].tMin);
        }
        var tmp = lecture.slides[lecture.slides.length-1].visuals;

		pentimento.lecture_controller.insert_recording(lecture, recording_params);
		recording_params = null;
		lecture = null;
	}
};

var saveToDisk = function(fileURL, fileName) {
    // for non-IE
    if (!window.ActiveXObject) {
        var save = document.createElement('a');
        save.href = fileURL;
        save.target = '_blank';
        save.download = fileName || 'unknown';

        var event = document.createEvent('Event');
        event.initEvent('click', true, true);
        save.dispatchEvent(event);
        (window.URL || window.webkitURL).revokeObjectURL(save.href);
    }

    // for IE
    else if ( !! window.ActiveXObject && document.execCommand)     {
        var _window = window.open(fileURL, '_blank');
        _window.document.close();
        _window.document.execCommand('SaveAs', true, fileName || fileURL)
        _window.close();
    }
};

