// Returns this.message
// Intended to be called for toString methods in error objects.
var getMessage = function() {return this.message;}

// These functions return an object that contains a name, a message, and a toString method so that it
// can be thrown as an error. The ones that do not take any parameters are still functions (instead of
// directly being the object) for consistency and to eliminate the possibility of someone permamently 
// changing the object properties. 

var invalidCharIndex = function(char_index) {
    return {
        name: 'invalidCharIndex',
        message: "No character exists at index " + char_index + ".",
        toString: getMessage
    }
};

var invalidStyleProp = function(property) {
    return {
        name: 'invalidStyleProp',
        message: "The style property '" + property + "' is not supported.",
        toString: getMessage
    }
};
