'use strict';

var RetimingController = function(lec) {
	var self = this;
	var lecture = lec;
	var state = pentimento.state;

	this.makeConstraintDirty = function(constraint) {
		constraint.setDisabled(true);
		return constraint;
	}

	this.cleanConstraints = function(constraints, amount) {
		for(var i in constraints) {
			var constraint = constraints[i];
			doShiftConstraint(constraint, amount);
			constraint.setDisabled(false);
		}
	}

	this.checkConstraint = function(constraint) {
		var constraints = lecture.getConstraints();
		for(var i in constraints) {
			var other = constraints[i];
			if(other.getTVisual() <= constraint.getTVisual() && other.getTAudio() <= constraint.getTAudio()) {
				continue;
			} else if(other.getTVisual() >= constraint.getTVisual() && other.getTAudio() >= constraint.getTAudio()) {
				continue;
			} else {
				return false;
			}
		}

		return true;
	}

	function unAddConstraint(constraint) {
		var constraints = lecture.getConstraints();
		var index = constraints.indexOf(constraint);
		constraints.splice(index, 1);

		um.add(function() {
			self.addConstraint(constraint);
		}, ActionTitles.AdditionOfConstraint);
	}

	this.addConstraint = function(constraint) {
		if(!self.checkConstraint(constraint)) { return false; }
		var index = 0;
		var constraints = lecture.getConstraints();
		var constIter = lecture.getConstraintsIterator();
		while(constIter.hasNext()) {
			var other = constIter.next();
			if(other.getTVisual() > constraint.getTVisual()) { break; }
			index++;
		}
		constraints.splice(index, 0, constraint);

		um.add(function() {
			unAddConstraint(constraint);
		}, ActionTitles.AdditionOfConstraint);
		return true;
	}

	function unDeleteConstraint(constraint, index) {
		var constraints = lecture.getConstraints();
		constraints.splice(index, 0, constraint);

		um.add(function() {
			self.deleteConstraint(constraint);
		}, ActionTitles.DeletionOfConstraint);
	}

	this.deleteConstraint = function(constraint) {
		var constraints = lecture.getConstraints();
		var index = constraints.indexOf(constraint);
		if(index==-1) { return; }
		constraints.splice(index, 1);

		um.add(function() {
			unDeleteConstraint(constraint, index);
		}, ActionTitles.DeletionOfConstraint);
	}

	function doShiftConstraint(constraint, amount) {
		constraint.setTVisual(constraint.getTVisual()+amount);
		constraint.setTAudio(constraint.getTAudio()+amount);
	}

	this.shiftConstraints = function(constraints, amount) {
		for(var i in constraints) {
			var constraint = constraints[i];
			doShiftConstraint(constraint, amount);
		}

		// um.add(function() {
		// 	self.shiftConstraints(constraints, -1.0*amount);
		// }, ActionTitles.ShiftConstraints);
	}

	function getPreviousConstraint(time, type) {
		if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getPreviousConstraint'); return; }

		var constraints = lecture.getConstraints();
		var best;
		if(type=="Audio") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTAudio() >= time) { break; }
				best = constraint;
			}
		} else if(type=="Video") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTVisual() >= time) { break; }
				best = constraint;
			}
		}
		return best;
	}

	function getNextConstraint(time, type) {
		if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getNextConstraint'); return; }

		var constraints = lecture.getConstraints();
		constraints.reverse();
		var best;
		if(type=="Audio") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTAudio() <= time) { break; }
				best = constraint;
			}
		} else if(type=="Video") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTVisual() <= time) { break; }
				best = constraint;
			}
		}
		constraints.reverse();
		return best;
	}

	// function tryConstraint(time, type) {
	// 	if(type=="Audio") {
	// 		for(var i in constraints) {
	// 		}
	// 	} else if(type=="Video") {
	// 	}
	// }

	this.getVisualTime = function(audioTime) {
		var prev = getPreviousConstraint(audioTime, "Audio");
		var next = getNextConstraint(audioTime, "Audio");
		if(prev==undefined || next==undefined || next.getDisabled()) { return audioTime; }
		return (next.getTVisual()-prev.getTVisual())/(next.getTAudio()-prev.getTAudio())*(audioTime-prev.getTAudio())+prev.getTVisual();
	}

	this.getAudioTime = function(visualTime) {
		var prev = getPreviousConstraint(visualTime, "Video");
		var next = getNextConstraint(visualTime, "Video");
		if(prev==undefined || next==undefined || next.getDisabled()) { return visualTime; }
		return (next.getTAudio()-prev.getTAudio())/(next.getTVisual()-prev.getTVisual())*(videoTime-prev.getTVisual())+prev.getTAudio();
	}
};
