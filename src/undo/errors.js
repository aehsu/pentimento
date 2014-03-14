// Returns this.message
// Intended to be called for toString methods in error objects.
var getMessage = function() {return this.message;}

// These functions return an object that contains a name, a message, and a toString method so that it
// can be thrown as an error. The ones that do not take any parameters are still functions (instead of
// directly being the object) for consistency and to eliminate the possibility of someone permamently 
// changing the object properties. 

var buttonDisabilityError = function(key) {
    return {
        name: 'buttonDisabilityError',
        message: 'The ' + key + ' button has the wrong disabled value',
        toString: getMessage
    }
};

var buttonTextError = function(key) {
    return {
        name: 'buttonTextError',
        message: 'The ' + key + ' button has the wrong text label',
        toString: getMessage
    }
};

var concatFunctionError = function() {
    return {
        name: 'concatFunctionError',
        message: "Both arguments to concatFunction() must be functions",
        toString: getMessage
    }
}

var groupEndError = function(group) {
    return {
        name: 'groupEndError',
        message: "There is no '" + group + "' to end.",
        toString: getMessage
    };
};

var groupRedoError = function(group) {
    return {
        name: 'groupRedoError',
        message: "Cannot currently redo " + group,
        toString: getMessage
    };
};

var groupUndoError = function(group) {
    return {
        name: 'groupUndoError',
        message: "Cannot currently undo " + group,
        toString: getMessage
    };
};

var indexOutOfBoundsError = function(index) {
    return {
        name: 'indexOutOfBoundsError',
        message: "Index " + index + " is out of bounds.",
        toString: getMessage
    };
};

var invalidEventTypeError = function(eventType) {
    return {
        name: 'invalidEventTypeError',
        message: "'" + eventType + "' is not a valid event type.",
        toString: getMessage
    };
};

var listenerNotSubscribedError = function() {
    return {
        name: 'listenerNotSubscribedError',
        message: "The listener is not subscribed.",
        toString: getMessage
    };
};

var missingPropertyError = function(property) {
    return {
        name: 'missingPropertyError',
        message: "The event is missing the '" + property + "' property.",
        toString: getMessage
    };
};

var noEventTypeError = function() {
    return {
        name: 'noEventTypeError',
        message: "The event object did not have a 'type' property.",
        toString: getMessage
    };
};

var notEndOfGroupError = function(group, index) {
    return {
        name: 'notEndOfGroupError',
        message: "The group '" + group + "' does not end at index " + index + ".",
        toString: getMessage
    };
};

var notGroupError = function(group) {
    return {
        name: 'notGroupError',
        message: "The group '" + group + "' does not exist.",
        toString: getMessage
    };
};

var notInGroupError = function(group) {
    return {
        name: 'notInGroupError', 
        message: "The action is not in the group '" + group + "'.",
        toString: getMessage
    };
};

var setUpError = function() {
    return {
        name: 'setUpError',
        message: " - set up error",
        toString: getMessage
    };
};

var shortArrayError = function(arrayId) {
    return {
        name: 'shortArrayError',
        message: "Array did not have enough values - " + arrayId,
        toString: getMessage
    };
};

var redoError = function() {
    return {
        name: 'redoError',
        message: "No individual action to redo.",
        toString: getMessage
    };
};

var undoError = function() {
    return {
        name: 'undoError',
        message: "No actions to undo.",
        toString: getMessage
    };
};

var unorderedSpliceError = function() {
    return {
        name: 'unorderedSpliceError',
        message: "Invalid arguments passed to unorderedSplice().",
        toString: getMessage
    };
};

// These functions return strings that are logged in the console as warnings more than once.
// This way, if they need to be edited, they only have to be edited in one place.

var groupAutoClose = function(group) {
    return "The group '" + group + "' is being automatically ended.";
};