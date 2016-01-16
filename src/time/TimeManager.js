/**
 * Manages any "time" field - all model fields which represent a lecture
 * timestamp should be created through this class, and destructed whenever
 * the parent model object is removed from the lecture model.
 */
var TimeManager = function() {
    var timeManager = {};

    var timeInstances = [];

    /**
     * Inner class to represent a "time" field. Registers itself
     * with the parent TimeManager upon instantiation, and removes
     * itself when destruct() is called.
     */
    var TimeInstance = function(time) {
        var timeInstance = {};

        /**
         * @return the timestamp represented by this instance
         */
        timeInstance.get = function() {
            return time;
        };

        /**
         * @param newTime the new timestamp for this instance
         */
        timeInstance.set = function(newTime) {
            time = newTime;
        };

        /**
         * @param deltaTime the amount of time to shift this timestamp by
         */
        timeInstance.shift = function(deltaTime) {
            time += deltaTime;
        };

        /**
         * destructs this timestamp instance; removes itself
         * from the parent TimeManager
         */
        timeInstance.destruct = function() {
            timeInstances.splice(timeInstances.indexOf(timeInstance), 1);
        };

        // register upon creation
        timeInstances.push(timeInstance);

        return timeInstance;
    };

    /**
     * @param time the floating-point timestamp that the returned TimeInstance should represent
     * @return a TimeInstance initialized to the given timestamp, registered with this TimeManager
     */
    timeManager.getAndRegisterTimeInstance = function(time) {
        return new TimeInstance(time);
    };

    /**
     * @param startShiftTime every registered TimeInstance from this timestamp onward will be shifted
     * @param shiftDeltaTime every TimeInstance to be shifted will be shifted by this much
     */
    timeManager.shiftAfterBy = function(startShiftTime, shiftDeltaTime) {
        for (var i in timeInstances) {
            var timeInstance = timeInstances[i];
            if (timeInstance.get() >= startShiftTime) {
                timeInstance.shift(shiftDeltaTime);
            }
        }
    };

    timeManager.clear = function() {
        timeInstances = [];
    };

    return timeManager;
};

/**
 * @return a singleton instance of TimeManager for visuals
 */
TimeManager.getVisualInstance = function() {
    if (TimeManager._v_instance === undefined) {
        TimeManager._v_instance = new TimeManager();
    }
    return TimeManager._v_instance;
};

/**
 * @return a singleton instance of TimeManager for audio
 */
TimeManager.getAudioInstance = function() {
    if (TimeManager._a_instance === undefined) {
        TimeManager._a_instance = new TimeManager();
    }
    return TimeManager._a_instance;
};
