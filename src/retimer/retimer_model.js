"use strict";

var RetimerModel = function(lec) {
	var self = this;
	var lecture = lec;
	var constraints = [];

    // The minimum allowed distance between constraints in milliseconds
    var TOLERANCE = 10;

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
	};

    // Check to see if the constraint is in a valid position
	this.checkConstraint = function(constraint) {

        // Check the constraint against all the other constraints, except for itself
		for(var i in constraints) {
			var other = constraints[i];
            if (other === constraint) {
                continue;
            };

            // Make sure the constraint is fully on the left or right of the other constraint
            // The constraint should not overlap the other in any way.
			if (other.getTVisual() < constraint.getTVisual() - TOLERANCE &&
                other.getTAudio() < constraint.getTAudio() - TOLERANCE) {
				continue;
			} else if ( other.getTVisual() > constraint.getTVisual() + TOLERANCE &&
                        other.getTAudio() > constraint.getTAudio() + TOLERANCE) {
				continue;
			} else {
				return false;
			}
		};

		return true;
    };

    // Update the visuals part of the constraint located at the specified audio time (tAud)
    // test (default - false): optional boolean indicating whether to test the update without actually updating
    // Returns a boolean indicating whether the update was successful
    this.updateConstraintVisualsTime = function(tAud, audioTimeCorrespondingToNewVisualsTime, test) {

        // Set test to the defualt value of false if it is not defined
        if (typeof test !== 'boolean') {
            test = false;
        };

        // Get the new visual time (in terms of the new audio time)
        var newTVis = self.getVisualTime(audioTimeCorrespondingToNewVisualsTime);

        // Get the constraint located at the audio time
        var constraint = self.getConstraintAtAudioTime(tAud);

        // If the constraint was not found, do nothing
        if (!constraint) {
            console.error('constraint not found')
            return false;
        };

        // Keep the old time for the visual and then set it to the new value
        var oldTVisual = constraint.getTVisual();
        constraint.setTVisual(newTVis);

        // Check the constraint to see if it is valid after the move
        var isValid = self.checkConstraint(constraint);

        // If the update was invalid or just a test, restore the constraint tVisual to the previous value
        if (test || !isValid) {
            constraint.setTVisual(oldTVisual);
        };

        // Return whether the update was valid
        return isValid;
    };

    // Update the audio part of the constraint located at the specified visuals time (tVid)
    // test (default - false): optional boolean indicating whether to test the update without actually updating
    // Returns a boolean indicating whether the update was successful
    this.updateConstraintAudioTime = function(tVis, newTAudio, test) {

        // Set test to the defualt value of false if it is not defined
        if (typeof test !== 'boolean') {
            test = false;
        };

        // Get the constraint located at the visual time
        var constraint = self.getConstraintAtVisualTime(tVis);

        // If the constraint was not found, do nothing
        if (!constraint) {
            console.error('constraint not found')
            return false;
        };

        // Keep the old time for the audio and then set it to the new value
        var oldTAudio = constraint.getTAudio();
        constraint.setTAudio(newTAudio);

        // Check the constraint to see if it is valid after the move
        var isValid = self.checkConstraint(constraint);

        // If the update was invalid or just a test, restore the constraint tVisual to the previous value
        if (test || !isValid) {
            constraint.setTAudio(oldTAudio);
        };

        // Return whether the update was valid
        return isValid;
    };

	this.addConstraint = function(constraint) {

		if(!self.checkConstraint(constraint)) { 
            return false; 
        }

		var index = 0;
		var constIter = self.getConstraintsIterator();
		while(constIter.hasNext()) {
			var other = constIter.next();
			if(other.getTVisual() > constraint.getTVisual()) {
                break;
            }
			index++;
		}
		constraints.splice(index, 0, constraint);

		return true;
	}

	this.deleteConstraint = function(constraint) {
		var index = constraints.indexOf(constraint);
		if(index==-1) { return; }
		constraints.splice(index, 1);
	};

	this.shiftConstraints = function(constraints, amount) {
		for(var i in constraints) {
			var constraint = constraints[i];
            constraint.setTVisual(constraint.getTVisual()+amount);
            constraint.setTAudio(constraint.getTAudio()+amount);
		};
	};

	this.getConstraintsIterator = function() {
        return new Iterator(constraints);
    };

	this.getPreviousConstraint = function(time, type) {
		if(type!="Audio" && type!="Video") {
            console.error('passed in an invalid type to getPreviousConstraint: ' + type);
            return; 
        }

		var best;
		if(type=="Audio") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if (constraint.getTAudio() >= time) {
                    break;
                }
				best = constraint;
			}
		} else if(type=="Video") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTVisual() >= time) { 
                    break;
                }
				best = constraint;
			}
		}
		return best;
	};

	this.getNextConstraint = function(time, type) {
		if(type!="Audio" && type!="Video") { 
            console.error('passed in an invalid type to getNextConstraint: ' + type); 
            return;
        }

		constraints.reverse();
		var best;
		if(type=="Audio") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTAudio() <= time) {
                    break; 
                }
				best = constraint;
			}
		} else if(type=="Video") {
			for(var i in constraints) {
				var constraint = constraints[i];
				if(constraint.getTVisual() <= time) { 
                    break;
                }
				best = constraint;
			}
		}
		constraints.reverse();
		return best;
	}

    // Get the constraint located at the visual time
    // Returns null if it doesn't exist
    this.getConstraintAtVisualTime = function(visual_time) {
        console.log('search for constraint at visual time: ' + visual_time)

        // Itereate over the constraints until the constraint with the matching visual time is found
        var result = null;
        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];
            console.log('visualtime: ' + constraint.getTVisual());
            if (constraint.getTVisual() === visual_time) {
                result = constraint;
                break;
            };
        };

        return result;
    };

    // Get the constraint located at the audio time
    // Returns null if it doesn't exist
    this.getConstraintAtAudioTime = function(audio_time) {
        console.log('search for constraint at audio time: ' + audio_time)

        // Itereate over the constraints until the constraint with the matching audio time is found
        var result = null;
        for (var i = 0; i < constraints.length; i++) {
            var constraint = constraints[i];
            console.log('audiotime: ' + constraint.getTAudio());
            if (constraint.getTAudio() === audio_time) {
                result = constraint;
                break;
            };
        };

        return result;
    };

    // Convert audio to visual time
	this.getVisualTime = function(audioTime) {
		var prev = self.getPreviousConstraint(audioTime, "Audio");
		var next = self.getNextConstraint(audioTime, "Audio");
		if (prev==undefined || next==undefined || next.getDisabled()) { 
            return audioTime; 
        }
		return (next.getTVisual()-prev.getTVisual())/(next.getTAudio()-prev.getTAudio())*(audioTime-prev.getTAudio())+prev.getTVisual();
	};

    // Convert visual to audio time
	this.getAudioTime = function(visualTime) {
		var prev = self.getPreviousConstraint(visualTime, "Video");
		var next = self.getNextConstraint(visualTime, "Video");
		if(prev==undefined || next==undefined || next.getDisabled()) { 
            return visualTime; 
        }
		return (next.getTAudio()-prev.getTAudio())/(next.getTVisual()-prev.getTVisual())*(videoTime-prev.getTVisual())+prev.getTAudio();
	};

	this.getNumberOfConstraints = function(){
		return constraints.length;
	};
};

var ConstraintTypes = {
	Manual: "Manual",
	Automatic: "Automatic"
}

var Constraint = function(tvis, taud, mytype) {
    var self = this;
    var tVis = tvis;
    var tAud = taud;
    var type = mytype;
    var disabled = false;

    this.getTVisual = function() { return tVis; }
    this.getTAudio = function() { return tAud; }
    this.getType = function() { return type; }
    this.getDisabled = function() { return disabled; }

    this.setTVisual = function(newTVis) { 
        tVis = Math.round(newTVis); 
    };

    this.setTAudio = function(newTAud) {
        tAud = Math.round(newTAud); 
    };

    this.setType = function(newType) { type = newType; }
    this.setDisabled = function(newBool) { disabled = newBool; }
};
