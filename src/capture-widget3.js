var pentimento = new function() {
	/*************************************************
					  CONTROLLERS
	*************************************************/
	this.uiux_controller = function(init) {
		$(recording).click(function() {
			$(recording).toggleClass('hidden');
			lecture_control.toggle_recording();
		});

		var set_slider_ticks = function(t_audio) {
			$(slider).slider('option', 'max', t_audio);
		};
	}

	this.recording_controller = function (init) { //sync slider + ticker. holds triggers for things. will hold temp lecture for insertions
		var canvas = '#'+init.canvas_id;
		var slider = '#'+init.slider_id;
		var recording = '.'+init.recording_buttons;
		var lecture_control = init.lecture_control;
	};


	//only accessible through the lecture_controller
	var slide_controller = function(slide) {
		 var slide = slide;
	};


	this.lecture_controller = function(lecture) {
		var lec = lecture;//hmmmmm.....should be okay.

		var sync_lecture_ending_time= function() {

		};

		this.create_slide_with_controller = function() {
			var page = new slide();//terrible naming convention...
			if(lec.slides.length == 0) {
				lec.begin_time = global_time();
			}
			lec.add_slide(page);
			lec.current_slide = page;
			var slide_control = new slide_controller(page);
			return slide_control;
		};

		this.toggle_recording = function() {
			if(lec.current_time == null && lec.is_recording = true) { //equally valid if say lec.end_time == null. this is when you stop recording.
				lec.current_time = lec.end_time = global_time() - lec.begin_time;
			} else if (lec.current_time == lec.end_time) {

			} else {

			}
			lec.is_recording = !lec.is_recording;
		};
	};
};