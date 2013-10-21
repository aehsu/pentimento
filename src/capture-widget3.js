/*************************************************
					HELPERS
*************************************************/

function global_time() {
    var d = new Date();
    return d.getTime(); //milliseconds
}

var pentimento = new function() {
	/*************************************************
						MODELS
	*************************************************/

	//PUBLIC
	this.lecture = function() {
		this.slides = [];
		this.slide_changes = [];
		this.is_recording = false;
		this.current_slide = null;
		this.current_time = null; //necessary? relative to beginning
		this.end_time = null; //necessary? relative to beginning

		this.add_slide = function(slide) {
			this.slides.push(slide);
		};
	};
	

	//private method not exposable through the namespace
	var slide = function() {
		this.begin_time = null;
		this.end_time = null;
		this.VISUALS = [];
		this.current_time = null;

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


	//private method not exposable through the namespace
	var slide_change = function(from_page, to_page, t_audio) { //should this live with t_audio????
		this.from_page = from_page;
		this.to_page = to_page;
		this.t_audio = t_audio;
	};

	/*************************************************
					  CONTROLLERS
	*************************************************/
	this.recording_controller = function (init) { //sync slider + ticker. holds triggers for things. will hold temp lecture for insertions
		var canvas = '#'+init.canvas_id;
		var slider = '#'+init.slider_id;
		var recording = '.'+init.recording_buttons;
		var lecture_control = init.lecture_control;

		var set_slider_ticks = function(t_audio) {
			$(slider).slider('option', 'max', t_audio);
		};

		$(recording).click(function() {
			$(recording).toggleClass('hidden');
			lecture_control.toggle_recording();
		});
	};


	//only accessible through the lecture_controller
	var slide_controller = function(slide) {
		 var slide = slide;
	};


	this.lecture_controller = function(lecture) {
		var lec = lecture;//hmmmmm. probably more correct to not have the controller hold the object itself, which is what has just happened

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