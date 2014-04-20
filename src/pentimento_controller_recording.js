pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
	var recording = null;
    var slide_begin = NaN;
    var working_slide = null;
    var group_name = "Recording_Controller_Group";
    var state = pentimento.state;
//    var recordRTC = null;
//     navigator.getUserMedia({audio: true}, function(mediaStream) {
//        recordRTC = RecordRTC(mediaStream, {
//             autoWriteToDisk: true
//         });
//        recordRTC.startRecording();
//     });

    function add_slide() {
        var gt = global_time();
    	if(working_slide != null ) { end_slide(gt); }
        working_slide = new Slide();
        recording.slides.push(working_slide);
        slide_begin = gt+1; //stops slide overlap
    };

    function end_slide(end_time) {
    	working_slide.duration += end_time-slide_begin;
        slide_begin = NaN;
        working_slide = null;
    }

    this.add_visual = function(visual) {
        visual.tMin -= slide_begin;
        for(vert in visual.vertices) {
            visual.vertices[vert]['t'] -= slide_begin;
        }
        working_slide.visuals.push(visual); //change to local????
    };

	this.do_record = function() {
        pentimento.lecture_controller.begin_recording();
        recording = new Lecture();
        
        //for safety, explicitly set to be null, will need to recalculate upon exit of recording anyways.
        state.current_slide = null;
        add_slide();
        // Start the audio recording
        // recordRTC.startRecording();
	};

	this.stop_record = function() {
        var gt = global_time();
        // Stop the audio recording
//         recordRTC.stopRecording(function(audioURL) {
//            console.log(audioURL);
//
//             // Insert an audio track if there isn't one yet
//             var track = recording.audio_tracks[0];
//             if (typeof track === 'undefined') {
//                 track = new Audio_track();
//                 recording.audio_tracks.push(track);
//                 pentimento.lecture_controller.create_audio_track(track);
//             };
//
//             // Get information about the audio track from looking at the lecture state
//             var start_time = pentimento.state.last_time_update;
//             var current_time = global_time();
//             var audio_duration = current_time - start_time;
//             console.log("Recorded audio of length: " + audio_duration);
//
//             // Insert the audio segment into the track
//             var segment = new Audio_segment(audioURL, 0, audio_duration, start_time, current_time);
//             recording.audio_tracks.push(segment);
//             pentimento.lecture_controller.create_audio_segment(segment);
//
//
//        //     // TEMP: Try writing the audio to disk
//        //     // saveToDisk(audioURL, "testrecord");
//        //     // recordRTC.writeToDisk();
//
//             (function () {
//                 var eventHandlers = {
//                     'play': function () {
//                         pentimento.state.wavesurfer.playPause();
//                     }
//                 };
//
//                 document.addEventListener('click', function (e) {
//                     var action = e.target.dataset && e.target.dataset.action;
//                     if (action && action in eventHandlers) {
//                         eventHandlers[action](e);
//                     }
//                 });
//             }());
//         });

        end_slide(gt);
		pentimento.lecture_controller.insert_recording(recording);
		recording = null;
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