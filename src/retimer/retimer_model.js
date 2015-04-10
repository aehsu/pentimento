"use strict";

var RetimerModel = function(lec) {
	var self = this;
	var lecture = lec;
	var constraints = [];

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
		// var constraints = lecture.getConstraints();
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
    };

    // Update the visuals part of the constraint located at the specified audio time (tAud)
    this.updateConstraintVisualsTime = function(tAud, audioTimeCorrespondingToNewVisualsTime) {

        // Get the new visual time (in terms of the new audio time)
        var newTVis = self.getVisualTime(audioTimeCorrespondingToNewVisualsTime);
        console.log("newTVis: " + newTVis);
        
        // Get the constraints to iterate over
        var constraints = self.getConstraintsIterator();

        // Iterate through the constraints until the audio time matches the audio time of a constraint
        // (since audio was not moved that will be the constraint to update)
        while(constraints.hasNext()){
            var constraint = constraints.next();
            var currTAud = constraint.getTAudio();
            console.log("currAudio: " + currTAud);

            // Once the audio time of the current constraint = the audio time of the dragged constraint reset
            // the visual time of that specific constraint
            if(currTAud == tAud){
                console.log("SETTING!");
                constraint.setTVisual(newTVis);
                break;
            }
        }
    };

    // Update the audio part of the constraint located at the specified visuals time (tVid)
    this.updateConstraintAudioTime = function(tVis, newAudioTime) {

        // Itereate over the constraints until the constraint with the visual time matching the visual time of the
        // dragged constraint is located and update audio time to match the new audio time
        var constraints = self.getConstraintsIterator();
        while(constraints.hasNext()){
            var constraint = constraints.next();
            var currTVis = constraint.getTVisual();
            console.log("currVis: " + currTVis);

            // Once the visual time of the current constraint = the visual time of the dragged constraint reset
            // the audio time of that specific constraint
            if(currTVis == tVis){
                console.log("SETTING!");
                constraint.setTAudio(newAudioTime);
                break;
            }
        }
    };

	this.addConstraint = function(constraint) {
		if(!self.checkConstraint(constraint)) { return false; }
		var index = 0;
		// var constraints = lecture.getConstraints();
		var constIter = self.getConstraintsIterator();
		while(constIter.hasNext()) {
			var other = constIter.next();
			if(other.getTVisual() > constraint.getTVisual()) { break; }
			index++;
		}
		constraints.splice(index, 0, constraint);

		return true;
	}

	this.deleteConstraint = function(constraint) {
		// var constraints = lecture.getConstraints();
		var index = constraints.indexOf(constraint);
		if(index==-1) { return; }
		constraints.splice(index, 1);
	};

	this.shiftConstraints = function(constraints, amount) {
		for(var i in constraints) {
			var constraint = constraints[i];
            constraint.setTVisual(constraint.getTVisual()+amount);
            constraint.setTAudio(constraint.getTAudio()+amount);
		}
	};

	this.getConstraintsIterator = function() {
        return new Iterator(constraints);
    };

	this.getPreviousConstraint = function(time, type) {
		if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getPreviousConstraint'); return; }

		// var constraints = lecture.getConstraints();
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
	};

	this.getNextConstraint = function(time, type) {
		if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getNextConstraint'); return; }

		// var constraints = lecture.getConstraints();
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

	this.getVisualTime = function(audioTime) {
		var prev = self.getPreviousConstraint(audioTime, "Audio");
		var next = self.getNextConstraint(audioTime, "Audio");
		if(prev==undefined || next==undefined || next.getDisabled()) { return audioTime; }
		return (next.getTVisual()-prev.getTVisual())/(next.getTAudio()-prev.getTAudio())*(audioTime-prev.getTAudio())+prev.getTVisual();
	}

	this.getAudioTime = function(visualTime) {
		var prev = self.getPreviousConstraint(visualTime, "Video");
		var next = self.getNextConstraint(visualTime, "Video");
		if(prev==undefined || next==undefined || next.getDisabled()) { return visualTime; }
		return (next.getTAudio()-prev.getTAudio())/(next.getTVisual()-prev.getTVisual())*(videoTime-prev.getTVisual())+prev.getTAudio();
	}

	this.getNumberOfConstraints = function(){
		return constraints.length;
	}
};

var ConstraintTypes = {
	Manual: "Manual",
	Automatic: "Automatic"
}

var Constraint = function(tvis, taud, mytype) {
    var self = this;
    self.tVis = tvis;
    self.tAud = taud;
    self.type = mytype;
    self.disabled = false;

    this.getTVisual = function() { return self.tVis; }
    this.getTAudio = function() { return self.tAud; }
    this.getType = function() { return self.type; }
    this.getDisabled = function() { return self.disabled; }

    this.setTVisual = function(newTVis) { self.tVis = newTVis; }
    this.setTAudio = function(newTAud) { self.tAud = newTAud; }
    this.setType = function(newType) { self.type = newType; }
    this.setDisabled = function(newBool) { self.disabled = newBool; }
}