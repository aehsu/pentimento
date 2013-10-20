/*************************************************
				  CONTROLLERS
*************************************************/
function recordController(init) {

}

/*************************************************
					MODELS
*************************************************/
function lecture(init) {
	this.slides = [];
	this.slide_changes = [];
	this.is_recording = false;
	this.current_slide = null;
	this.current_time = null; //necessary?
	this.end_time = null; //necessary?

}

function slide(init) {
	this.begin_time = null;
	this.end_time = null;
	this.VISUALS = [];
	this.current_time = null;

	this.addVisual = function(visual) {
		this.VISUALS.push(visual);
	}
	this.getVisuals = function() {
		return this.VISUALS;
	}
	this.getVisual = function(index) {
		return this.VISUALS[index];
	}
	
}

function slideChange(init) {

}