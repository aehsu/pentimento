pentimento.audio_controller = function() {

	//
	// Member vars
	//

	// self can be used to refer to the object in different scopes (such as listeners)
	var self = this;

	// Array of pentimento.audio_track
	var audio_tracks = [];

	// RecordRTC is used to record the audio stream
	var recordRTC = null;

    // Wavesurfer is used to display audio waveforms
    // Right now it is initialized in refresh_audio_display
    var wavesurfer = null;

    // begin_record_time is the global lecture time when the recording was started
    // -1 indicates that there is no recording in progress
    var begin_record_time = -1;

    var audio_timeline_scale = 100;


    //
    // Pubilc methods
    // 

    // Initializes the audio controller
    // Should only be called after the document is ready
    this.init = function () {
    	console.log("initialize: pentimento_audio_controller")

    	// RecordRTC setup
		navigator.getUserMedia({audio: true}, function(mediaStream) {
	    recordRTC = RecordRTC(mediaStream, {
	            autoWriteToDisk: true
	        });
	       recordRTC.startRecording();
	    });

    	// Button listener to start playing the audio
    	var play_pause_button = $("#play_pause_button");
		play_pause_button.click(function() { 
		    wavesurfer.playPause();
		});

		// Button listener to record or stop the current recording
		var record_audio_button = $("#record_audio_button");
		record_audio_button.click(function() {
        	console.log("record_audio event listener");
        	var isRecording = begin_record_time < 0;

        	// Change the button text depending on the record status
			record_audio_button.html(isRecording ? 'Stop': 'Record');
				console.log(self);

			// Start or stop recording
			if (!isRecording) {
				self.begin_recording();
			} else{
				self.end_recording();
			};
		});
    }

    // Start recording the audio at the lecture time
    this.begin_recording = function() {
        var begin_record_time = pentimento.state.current_time;
        recordRTC.startRecording();
    }

    // End the recording (only applies if there is an ongoing recording)
    this.end_recording = function() {
        var end_record_time = pentimento.state.current_time;

        // Stop the recordRTC instance and use the callback to save the track
        recordRTC.stopRecording(function(audioURL) {
           console.log(audioURL);

            // Insert an audio track if there isn't one yet
            var track = audio_tracks[0];
            if (typeof track === 'undefined') {
                track = new pentimento.audio_track();
                audio_tracks.push(track);
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

        // Update the audio display
        this.refresh_audio_display();
    }

    // Refreshes the audio timeline display to show the tracks and segments
    this.refresh_audio_display = function() {

        var draw_gradations = function() { 
            var timeline = $('#audio_timeline');
            var gradation_container = $('<div></div>');
            gradation_container.attr('id', 'gradation_container').css('width', timeline.width()).css('height', timeline.height());
            timeline.append(gradation_container);

            // Changes tickpoints into time display (ex: 00:30:00)
            // Each tickpoint unit is one second which is then scaled by the audio_timeline_scale
            var tickFormatter = function (tickpoint) {
                var sec_num = parseInt(tickpoint, 10);
                var hours   = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds = sec_num - (hours * 3600) - (minutes * 60);

                if (hours   < 10) {hours   = "0"+hours;}
                if (minutes < 10) {minutes = "0"+minutes;}
                if (seconds < 10) {seconds = "0"+seconds;}
                var time    = hours+':'+minutes+':'+seconds;
                return time;
            }
            var options = {
                series: {
                    lines: { show: false },
                    points: { show: true }
                },
                yaxis: {
                    ticks: {show: true}
                },
                xaxis: {
                    min: 0, // Min and Max refer to the range
                    max: 100,
                    tickFormatter: tickFormatter
                },
                grid: {
                    // hoverable: true
                }
            };

            // Dummy data
            var plot_data = [ [0, 0], [0, 10] ];

            // create cursor object
            var timeline_cursor = $('#timeline_cursor');
            if (timeline_cursor.length === 0) {
                 timeline_cursor = $('<div></div>').attr({'id': 'timeline_cursor'});
                 $('#audio_timeline').append(timeline_cursor);
            }
            


            $.plot(gradation_container, plot_data, options);
            // Bind hover callback to get mouse location
            $('#audio_timeline').bind("mousemove", function (event) {
                    // Display bar behind mouse
                    $('#timeline_cursor').css({
                       left:  event.pageX
                    });
                });
            }

        // Clear the existing audio timeline
        $("#audio_timeline").html("");

        // Draw gradations into the timeline
        draw_gradations();

        // Iterate over all audio tracks
        console.log(audio_tracks.length);
        for (var i = 0; i < audio_tracks.length; i++) {
            var audio_track = audio_tracks[i];
            console.log(audio_track);

            // Create a new track div and set it's data
            var new_track_id = "track-" + i;
            var new_track = $('<div></div>').attr({"id": new_track_id , "class": "audio_track"});
            new_track.data(audio_track);
            $("#audio_timeline").append(new_track);

            // Iterate over all segments for that track
            for (var j = 0; j < audio_track.audio_segments.length; j++) {
                var audio_segment = audio_track.audio_segments[i];

                // Create a new segment div 
                var new_segment_id = "segment-" + j;
                var new_segment = $("<div></div>").attr({"id": new_segment_id, "class": "audio_segment"});
                new_segment.data(audio_segment);
                new_track.append(new_segment);

                // Set the css for the new segment
                new_segment.css({ "padding": 0, 
                				"width": (audio_segment.end_time - audio_segment.start_time)*audio_timeline_scale, 
                				"height": $("#audio_timeline").height()/2 });
        
                // Setup the dragging
                new_segment.draggable({
                    containment: ("#" + new_track_id),
                    axis: "x",
                    opacity: 0.75
                }).on( "dragstart", function( event, ui ) {
                    ui.helper.addClass('dragged')
                }).on( "dragstop", function( event, ui ) { // check to see if segment was dragged to an end of another segment
                    // Call shift function in model
                    // audio_segment.shift_segment(ui.position.left - ui.originalPosition.left)
                    ui.helper.removeClass('dragged')
                }).resizable({
                    handles: "e, w",
                    minWidth: 1,
                    stop: function( event, ui ) {
                        dwidth = ui.originalSize.width - ui.size.width;
                        if (ui.position.left === ui.originalPosition.left) // then right handle was used
                            // Trim audio from Right
                            audio_segment.crop_segment(dwidth, "right");
                        else
                            // Trim audio from Left
                            audio_segment.crop_segment(dwidth, "left");
                    }
                });

                // Load the waveform to be displayed inside the segment div
                wavesurfer = Object.create(WaveSurfer);
                console.log("#" + new_segment_id)

                wavesurfer.init({
                    container: document.querySelector("#" + new_segment_id),
                    waveColor: 'violet',
                    progressColor: 'purple',
                    height: $("#audio_timeline").height()/2
                });

                wavesurfer.on('ready', function () {
                    wavesurfer.play();
                });

                wavesurfer.load(audio_segment.audio_resource);

            }; // End of audio segments loop
        }; // End of audio tracks loop
    };

    // Given the location where the segment is dropped, this function figures out where to place the audio
    // segment and moves the other audio segments to their correct locations
    this.place_segment =  function ( segment_idx, mouse_position ) {
        // Iterate over audio tracks in DOM
        $("audio_track").each(function() {
            // Check to see if it over laps with segment on the left half
            if ( mouse_position.x >= $(this).offset.left && mouse_position.x <= $(this).offset.left + $(this).width()/2 ) {
                console.log('move to left');
                // Move segment to the left of conflicting segment
                this.insert_segment();
            }
            // Check to see if it over laps with segment on the right half
            else if ( mouse_position.x > $(this).offset.left + $(this).width()/2 && mouse_position.x <= $(this).offset.left + $(this).width() ) {
                // Move segment to the left of conflicting segment
                console.log('move to right');
                this.insert_segment();
            }

        });
    };

    this.insert_segment = function (audio_segment, lecture_time) {
        // Iterate over all segments for that track
        for (var j = 0; j < audio_track.audio_segments.length; j++) {
            var audio_segment = audio_track.audio_segments[i];

            // Shift all segments on the right by the length of the segment
            if ( lecture_time <= audio_segment.lecture_start_time ) {
                pentimento.audio_track.shift_segment( audio_segment.id , audio_segment.length)
            };
        };
        // Put segment at lecture_time
        audio_segment.lecture_start_time = lecture_time;
        audio_segment.lecture_end_time = lecture_time + audio_segment.length;
    };



}

