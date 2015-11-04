"use strict";

var RecordingController = function() {
    var dirtyVisuals = [];

    // Creates wrappers around the visuals that keeps track of their previous time
    // and the times of their vertices. Then move the visuals to positive infinity.
    // Used at the end of a recording so that the visuals will not overlap with the ones being recorded.
    // Only processes visuals in the current slide after the current time.
    this.setDirtyVisuals = function(currentVisualTime) {

        var currentSlide = self.getSlideAtTime(currentVisualTime);

        // Iterate over all the visuals
        var visuals_iterator = currentSlide.getVisualsIterator();
        while (visuals_iterator.hasNext()) {
            var visual = visuals_iterator.next();

            // Only make the visual dirty if the time is greater than the current time
            if(visual.getTMin() <= currentVisualTime) {
                continue;
            };

            // Create the wrapper
            var wrapper = {
                visual: visual,
                tMin: visual.getTMin(),
            };

            // Move tMin to infinity
            visual.setTMin(Number.POSITIVE_INFINITY); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER

            // Add the wrapper to dirty visuals
            dirtyVisuals.push(wrapper);

        };  // end of iterating over visuals
    };

    // Restore to the previous time and add the shift amount.
    // Used at the end of a recording during insertion to shift visuals forward.
    this.cleanVisuals = function(shift_amount) {

        // Restore the original times from the wrapper
        var visuals = [];
        for(var i in dirtyVisuals) {
            var dirtyWrapper = dirtyVisuals[i];
            var visual = dirtyWrapper.visual;
            visuals.push(visual);
            visual.setTMin(dirtyWrapper.tMin);
        };

        // Perform a shift on all of the visuals that were dirty
        self.shiftVisuals(visuals, shift_amount);

        // Clear the dirty visuals
        dirtyVisuals = [];
    };
}
