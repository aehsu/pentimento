"use strict";

var RetimerModel = function() {
	var self = this;
	var constraints = [];

    // The minimum allowed distance between constraints in milliseconds
    var TOLERANCE = 10;

    this.getConstraints = function() {
        return constraints;
    };

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
    this.updateConstraintVisualsTime = function(constraint, audioTimeCorrespondingToNewVisualsTime, test) {

        // Set test to the defualt value of false if it is not defined
        if (typeof test !== 'boolean') {
            test = false;
        };

        // Get the new visual time (in terms of the new audio time)
        var newTVis = self.getVisualTime(audioTimeCorrespondingToNewVisualsTime);

        // If the constraint is not in the array of constraints, do nothing
        if (constraints.indexOf(constraint) < 0) {
            console.error('constraint not found')
            return false;
        };

        // Keep the old time for the visual and then set it to the new value
        var oldTVisual = constraint.getTVisual();
        var audioTimeCorrespondingToOldVisualsTime = self.getAudioTime(oldTVisual);
        constraint.setTVisual(newTVis);

        // Check the constraint to see if it is valid after the move
        var isValid = self.checkConstraint(constraint);

        // If the update was invalid or just a test, restore the constraint tVisual to the previous value
        // Else, push to the undo manager.
        if (test || !isValid) {
            constraint.setTVisual(oldTVisual);
        } else {
            // For the undo action, set the constraint's visual time to the old value.
            undoManager.registerUndoAction(self, self.updateConstraintVisualsTime, [constraint, audioTimeCorrespondingToOldVisualsTime]);
        };

        // Return whether the update was valid
        return isValid;
    };

    // Update the audio part of the constraint located at the specified visuals time (tVid)
    // test (default - false): optional boolean indicating whether to test the update without actually updating
    // Returns a boolean indicating whether the update was successful
    this.updateConstraintAudioTime = function(constraint, newTAudio, test) {

        // Set test to the defualt value of false if it is not defined
        if (typeof test !== 'boolean') {
            test = false;
        };

        // If the constraint is not in the array of constraints, do nothing
        if (constraints.indexOf(constraint) < 0) {
            console.error('constraint not found')
            return false;
        };

        // Keep the old time for the audio and then set it to the new value
        var oldTAudio = constraint.getTAudio();
        constraint.setTAudio(newTAudio);

        // Check the constraint to see if it is valid after the move
        var isValid = self.checkConstraint(constraint);

        // If the update was invalid or just a test, restore the constraint tVisual to the previous value.
        // Else, push to the undo manager.
        if (test || !isValid) {
            constraint.setTAudio(oldTAudio);
        } else {
            // For the undo action, set the constraint's audio time to the old value.
            undoManager.registerUndoAction(self, self.updateConstraintAudioTime, [constraint, oldTAudio]);
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

        // For the undo action, delete the added constraint
        undoManager.registerUndoAction(self, self.deleteConstraint, [constraint]);

		return true;
	}

	this.deleteConstraint = function(constraint) {
		var index = constraints.indexOf(constraint);
		if(index==-1) { return; }
		constraints.splice(index, 1);

        // For the undo action, add the deleted constraint
        undoManager.registerUndoAction(self, self.addConstraint, [constraint]);
	};

	this.shiftConstraints = function(constraints, amount) {
		for(var i = 0; i < constraints.length; i++) {
			var constraint = constraints[i];
            constraint.setTVisual(constraint.getTVisual()+amount);
            constraint.setTAudio(constraint.getTAudio()+amount);
		};

        // For the undo action, reverse shift the constraints
        undoManager.registerUndoAction(self, self.shiftConstraints, [constraints, -amount]);
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
		return (next.getTAudio()-prev.getTAudio())/(next.getTVisual()-prev.getTVisual())*(visualTime-prev.getTVisual())+prev.getTAudio();
	};

    // Saving the model to JSON
    // Returns the JSON object.
    this.saveToJSON = function() {
        var json_object = {
            constraints: []
        };
        
        var constraints = self.getConstraintsIterator();
        while(constraints.hasNext()) {
            var constraint = constraints.next();
            var tVis = constraint.getTVisual();
            var tAud = constraint.getTAudio();
            var type = constraint.getType();

            var constraint_obj = {'tVis': tVis, 'tAud': tAud, 'constraintType': type};
            json_object.constraints.push(constraint_obj);
        }

        return json_object;
    };
};
RetimerModel.loadFromJSON = function(json_object) { 

    var retimer_model = new RetimerModel();

    // The JSON object is an array containing the JSON constraint objects.
    // Get the constraint object from JSON and add it to the array of constraints.
    var json_constraints = json_object['constraints'];
    for (var i = 0; i < json_constraints.length; i++) {
        var new_const = new Constraint(json_constraints[i].tVis, json_constraints[i].tAud, json_constraints[i].constraintType);
        retimer_model.addConstraint(new_const);
    };      

    return retimer_model;
}; 

var ConstraintTypes = {
	Manual: "Manual",
	Automatic: "Automatic"
};

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
