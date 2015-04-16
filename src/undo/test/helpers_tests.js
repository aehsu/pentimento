// Tests the helper functions in helpers_and_globals.js

var test_concatFunction = function() {
    'use strict';
    var x = 0;
    var f1 = function() {x += 5;}
    var f2 = function() {x += 2;}
    var f12 = concatFunction(f1, f2);
    f12();
    if (x !== 7) {
        return false;
    }
    return true;

}

var test_isFunction = function(){
    'use strict';
    var f = function(){};
    var u;
    var x = 5;
    var y = {};
    var z = "helloWorld";
    if (!isFunction(f)) {
        return false;
    }
    else if (isFunction(u) || isFunction(x) || isFunction(y) || isFunction(z)) {
        return false;
    }
    return true;
};

var test_isNull = function() {
    'use strict';
    var n = null;
    var u;
    var x = 5;
    var y = {};
    var z = 'helloWorld';
    if (!isNull(n)) {
        return false;
    }
    if (isNull(u) || isNull(x) || isNull(y) || isNull(z)) {
        return false;
    }
    return true;
}

var test_isUndefined = function(){
    'use strict';
    var u;
    var x = 5;
    var y = {};
    var z = "helloWorld";
    if (!isUndefined(u)) {
        return false;
    }
    else if (isUndefined(x) || isUndefined(y) || isUndefined(z)) {
        return false;
    }
    return true;
};

var test_unorderedSplice = function () {
    'use strict';
    var a = [0, 1, 2, 3, 4, 5];
    unorderedSplice(a, 2, 1); // a = [0, 1, 5, 3, 4]
    if (a.length !== 5 || a[2] !== 5) {
        return false;
    }
    a.push(6); 
    unorderedSplice(a, 1, 3); // a = [0, 6, 4]
    if (a.length !== 3 || a[1] !== 6 || a[2] !== 4) {
        return false;
    }
    unorderedSplice(a, 2, 5); // a = [0, 6]
    if (a.length !== 2 || a[0] !== 0 || a[1] !== 6) {
        return false;
    }
    var numErrors = 0;
    var catchErrors = function(f) {
        try{
            f();
        } catch (e) {
            numErrors++;
        }
    };
    catchErrors(function(){unorderedSplice(a, 2, 1);});
    catchErrors(function(){unorderedSplice(a, -3, 1);});
    catchErrors(function(){unorderedSplice(a, 0, -5);});
    if (numErrors !== 3) {
        return false;
    }
    return true;
}