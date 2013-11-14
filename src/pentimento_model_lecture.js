/*************************************************
					MODEL
*************************************************/

//PUBLIC
pentimento.lecture = function() {
	this.slides = [];
	this.slide_changes = [];

	//move to elsewhere? high level function?
	var slide = function() {
		this.begin_time = null; //unnecessary??
		this.end_time = null;
		this.visuals = [];
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

	var slide_change = function(from_page, to_page, t_audio) { //should this live with t_audio????
		this.from_page = from_page;
		this.to_page = to_page;
		this.t_audio = t_audio;
	};

	this.add_slide = function() {
		var new_slide = new slide();
		this.slides.push(new_slide);
		//pentimento.state.change_state('current_slide', new_slide);
		return new_slide;
	};

	this.insert_slide = function() {
		var new_slide = new slide();
		var before_index = this.slides.indexOf(pentimento.state.current_slide);
		slides.insert(before_index+1, new_slide);
		//pentimento.state.change_state('current_slide', new_slide);
		return new_slide;
	}
};
