// Returns a function that is the result of concatenating the two arguments
// original - the function that will be performed first in the new function
// extra - the function that will be performed last in the new function
// Note that the control loop will stop at return statements, so if the original function has a
// return statement at the end that is always hit, the extra function will never run.
var concatFunction = function(original, extra) {
    'use strict';
    if (!isFunction(original) || !isFunction(extra)) {
        throw concatFunctionError();
    }
    var newFunction = function() {
        original();
        extra();
    };
    return newFunction;
};

// Returns true if arg is a function, false otherwise.
var isFunction = function(arg) {
    'use strict';
    return {}.toString.call(arg) === '[object Function]';
}; 

// Returns true if arg is null, false otherwise.
var isNull = function(arg) {
    'use strict';
    return {}.toString.call(arg) === '[object Null]';
};  

// Returns true if arg is undefined, false otherwise.
// Especially useful in cases where false is a valid value, but undefined is not.
var isUndefined = function(arg) {
    'use strict';
    return {}.toString.call(arg) === '[object Undefined]';
};


// An object with rgb values as keys and the corresponding color names as values.
// Used to convert css values to human readable labels.
var rgbNames = {
    "rgb(0, 0, 0)": 'black',
    "rgb(255, 255, 255)": 'white',
    "rgb(255, 0, 0)": 'red',
    "rgb(255, 165, 0)": 'orange',
    "rgb(255, 255, 0)": 'yellow',
    "rgb(0, 128, 0)": 'green',
    "rgb(0, 0, 255)": 'blue',
    "rgb(128, 0, 128)": 'purple'
};

// Prevent changes to rgbNames from additional scripts.
// The way the object is now is the way it'll always be.
Object.freeze(rgbNames);


// Removes elements from an array without maintaining the order. 
// (This is faster than splicing, which removes elements while maintaining order.)
// array - the array to remove elements from
// index - the index at which to start removing elements, must be positive and less than the array length
// amount - the number of elements to remove, cannot be negative. If the amount goes past the end of
//          the array, all the elements from the starting index will be removed.
var unorderedSplice = function(array, index, amount) {
    'use strict';
    if (index >= array.length || index < 0 || amount < 0) {
        throw unorderedSpliceError();
    }
    var stopIndex = index+amount; 
    var lastElem;
    while (index < stopIndex) {
        lastElem = array.pop();
        if (index !== array.length) {
            array[index] = lastElem;
        }
        else {
            index = stopIndex;
        }
        index++;
    }
    array = [];
};