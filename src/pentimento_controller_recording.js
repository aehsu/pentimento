pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
	var recording = null;
    var slide_begin = null;
    var recordRTC = null;
    var begin_record_time;
    navigator.getUserMedia({audio: true}, function(mediaStream) {
       recordRTC = RecordRTC(mediaStream, {
            autoWriteToDisk: true
        });
       recordRTC.startRecording();
    });
    var state = pentimento.state;
    var slide_counter; //maybe to be used.
    
	//move to elsewhere? high level function?
    function slide() {
        this.number = null;
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
    };

    function slide_change(from_page, to_page, time) {
        this.from_page = from_page;
        this.to_page = to_page;
        this.time = time;
    };

    this.add_slide = function() {
        var gt = global_time();
    	if(recording.slides.length != 0) {
    		var idx = recording.slides.indexOf(state.current_slide);
    		recording.slide_changes.push(new slide_change(idx, idx+1, gt));
    		end_slide(gt);
    	}
        var new_slide = new slide();
        recording.slides.push(new_slide);
        state.current_slide = new_slide;
        slide_begin = gt+2;
    };

    function end_slide(gt) {
    	state.current_slide.duration += gt-slide_begin;
        slide_begin = null;
    	state.current_slide = null;
    }

    this.add_visual = function(visual) {
        visual.tMin -= slide_begin;
        for(vert in visual.vertices) {
            visual.vertices[vert]['t'] -= slide_begin;
        }
        state.current_slide.visuals.push(visual); //change to local????
    };

	this.do_record = function() {
        pentimento.lecture_controller.begin_recording();
        recording = new pentimento.lecture();
		this.add_slide();
        begin_record_time = pentimento.state.current_time;

        // Start the audio recording
        recordRTC.startRecording();
	};

	this.stop_record = function() {
        var gt = global_time();
        var end_record_time = pentimento.state.current_time;

        // Stop the audio recording
        recordRTC.stopRecording(function(audioURL) {
           console.log(audioURL);

            // Insert an audio track if there isn't one yet
            var track = pentimento.lecture_controller.audio_tracks[0];
            if (typeof track === 'undefined') {
                track = new pentimento.audio_track();
                recording.audio_tracks.push(track);
            };
            

            // Get information about the audio track from looking at the lecture state
            var audio_duration = end_record_time - begin_record_time;
            console.log("Recorded audio of length: " + String(audio_duration));

            // Insert the audio segment into the track
            var segment = new pentimento.audio_segment(audioURL, 0, audio_duration, begin_record_time, end_record_time);
            console.log(segment);
            track.audio_segments.push(segment);

            // TEMP: Try writing the audio to disk
            // saveToDisk(audioURL, "testrecord");
            // recordRTC.writeToDisk();

        });

        end_slide(gt);
		pentimento.lecture_controller.insert_recording(recording);
		recording = null;

        // Update the audio display
        pentimento.lecture_controller.refresh_audio_display();

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