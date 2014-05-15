/*
    Files that must also be loaded when this script is run:
        errors.js
        undo.js

    Specific Requirements:
        Undoing a group before it has ended should undo the entire group - Test 3
        Actions undone before a group ended and redone after the group ended should be inside the group - Test 17, 23, 24
        Starting a group cannot be undone - Test 10
        If right before group, can only redo the entire group, not individual actions - Test 9
        Empty groups don't throw errors - Test 10
        Empty groups aren't added to the stack - Test 21
        Redoing a group puts it back to the way it was immediately before the undo - Test 22
        If a group is opened while already open, the first one should be automatically closed - Test 25
        If an outer group is closed while inner groups are still open, auto-close them (no overlapping groups allowed) - Test 26
        A group can be opened even if it's already opened - Tests 3, 10, 15
        If a group is started and then a previous action is undone/redone, the group is effectively gone - Test 29, 30


    Note that undoing a group before it's ended will automatically end it. If it's redone and then other actions are performed, 
    they will not be part of the group. //TODO: is this desired?

*/

var testUM = function (guiFunctions) {
    'use strict';
    var um = getUndoManager(['group1', 'group2', 'group3'], true);
    
    //will hold an array for each test scenario, which will in turn hold the failed functions for that particular scenario
    var failedScenarios = {};    
    
    //returns the undo manager functions that will be tested in each scenario.
    //these are retrieved using a function so that the um instance can be updated.
    var getUMfunctions = function(){
        return {
            undo: um.undo, 
            redo: um.redo, 
            startH1: function(){return um.startHierarchy('group1');}, 
            endH1: function(){return um.endHierarchy('group1');},
            undoH1: function(){return um.undoHierarchy('group1');}, 
            redoH1: function(){return um.redoHierarchy('group1');},
            startH2: function(){return um.startHierarchy('group2');}, 
            endH2: function(){return um.endHierarchy('group2');},
            undoH2: function(){return um.undoHierarchy('group2');}, 
            redoH2: function(){return um.redoHierarchy('group2');},
            startH3: function(){return um.startHierarchy('group3');}, 
            endH3: function(){return um.endHierarchy('group3');},
            undoH3: function(){return um.undoHierarchy('group3');}, 
            redoH3: function(){return um.redoHierarchy('group3');}
        };
    };
    
    var getBodyColorTitle = function (color) {
        if (color in rgbNames) {
            color = rgbNames[color];
        }
        return 'bodyColor: ' + color;
    }
    
    //Changes the body font color to the color that is passed in. This action is stored in the undo manager.
    //This will be used to perform actions in the test scenarios.
    //color - must be an acceptable value for the body color
    var changeBodyColor = function (color) {
        var orig = $('body').css('color');
        $('body').css('color', color);
        
        //add to the undo stack
        um.add(
            function(){changeBodyColor(orig)}, //the function that will undo the color change
            getBodyColorTitle(color) //the title of the actions
        );
    }; 

    changeBodyColor('red');
    
    //f - a function to run without letting errors stop the testing process
    //returns true if no errors are thrown, the error name if an error is thrown
    var ignoreErrors = function (f) {
        try{
            f();
            return true;
        } catch (e) {
            return e.name;
        }
    };
 
    var count = 0;

    // Returns an object with the same keys as getUMfunctions(), each of which hold the results of attempting the 
    // corresponding function. The results are of the format  [true/errorName (true indicating no errors), the length
    // of the undo stack, the length of the redo stack, the title of the action that can be undone, the title of the 
    // action that can be redone]. 
    // scenario - a function that sets up groups and/or actions, will be called before testing each function
    var getResults = function (scenario) {
        count++;
        var results = {};
        for (var key in getUMfunctions()){
            try {
                um = getUndoManager(['group1', 'group2', 'group3'], true); //get a clean undo manager
                scenario();
                results[key] = [ignoreErrors(getUMfunctions()[key])];
                results[key][1] = um.getUndoLength();
                results[key][2] = um.getRedoLength();
                results[key][3] = um.getUndoTitle();
                results[key][4] = um.getRedoTitle();
            } catch (e) {
                //this is most likely an error in calling scenario(), but keep in mind that it 
                //could also be an error with ignoreErrors or um.getIndex.
                results[key] = setUpError().name;
            }

        }
        console.log(count);
        console.log(results);
        return results;
    };

    //checks if the results of actualResults and expectedResults match
    //actualResults - object with arrays of experimental values. e.g. {test1: [val1, val2, ...], test2: [val1, val2, ...]}
    //expectedResults - object with arrays of values that the actualResults should match. Must have values for at
    //                least the same keys as actualResults. Cannot have a value equal to undefined. Value arrays 
    //                must be the same length as those in actualResults.
    //returns - an array of the keys that did not have matching expected and actual values
    var checkResults = function (expectedResults, actualResults){
        var badResults = [];
        for (var key in actualResults){
            for (var i = 0; i < actualResults[key].length; i++){
                if(actualResults[key] === setUpError().message){
                    //there was an error while running the test, but it did not come from the function being tested
                    badResults.push(key+actualResults[key])
                    break;
                }
                if (expectedResults[key][i] !== actualResults[key][i]) {
                    if (isUndefined(expectedResults[key][i])){ 
                        //there's not a value at this index in expectedResults[key]
                        throw shortArrayError('expectedResults['+key+']');
                    }
                    else{
                        //there is a value, but it doesn't match the corresponding value in actualResults
                        badResults.push(key);
                        break;
                    }
                }
            }
        }
        return badResults;
    };

    //returns an array of the keys of the functions that did not perform as expected
    //expectedResults - an object with arrays of expected values, e.g. {test1: [val1, val2, ...], test2: [val1, val2, ...]}
    //scenario - a function that sets up the testing environment before each function is called
    var getFailedFunctions = function (expectedResults, scenario){
        var results = getResults(scenario);
        return checkResults(expectedResults, results);
    };
    
    //standard error names to avoid mass editing
    //these are the errors that each function will generally run into, if any
    var errorNames = {
        undo: undoError().name,
        redo: redoError().name,
        startH1: null,
        endH1: groupEndError().name,
        undoH1: groupUndoError().name,
        redoH1: groupRedoError().name,
        startH2: null,
        endH2: groupEndError().name,
        undoH2: groupUndoError().name,
        redoH2: groupRedoError().name,
        startH3: null,
        endH3: groupEndError().name,
        undoH3: groupUndoError().name,
        redoH3: groupRedoError().name
    }
    
    /* 
        TEST 1
        no actions performed
        test basic functionality
    */
    
    //function to set up the testing environment (no actions are performed in this case)
    var scenario = function() { };
    
    var standardResults = [0, 0, null, null]; //[undoLen, redoLen, undoTitle, redoTitle]
 
    //the expected results of each function after the scenario is run. Each key: value pair is of the following format:
    // functionKey: [true/errorName (true indicating it should perform without errors), the length of the undo stack, 
    // the length of the redo stack, the title of the action that can be undone, the title of the action that can be redone]
    var expectedResults = { 
        //these don't currently match the specified format, the function concatStandardRes 
        //below will concatenate the standardResults to the arrays.
        undo: [errorNames['undo']],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']],
    };
    
    //if an array in expectedResults has only one value, concatenate standardResults to the end.
    var concatStandardRes = function () {
        for (var key in expectedResults) {
            if (expectedResults[key].length === 1) {
                expectedResults[key] = expectedResults[key].concat(standardResults);
            }
        }
    };
    
    concatStandardRes();
  
    //add the results of this test to failedScenarios
    failedScenarios['test1'] = getFailedFunctions(expectedResults, scenario);

    /* 
        TEST 2
        one action performed
        test that it can be undone
    */

    scenario = function(){
        changeBodyColor('red');
    };
    
    standardResults = [1, 0, getBodyColorTitle('red'), null];
    
    expectedResults = {
        undo: [true, 0, 1, null, getBodyColorTitle('red')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    };
    
    concatStandardRes();

    failedScenarios['test2'] = getFailedFunctions(expectedResults, scenario);
    
    /* 
        TEST 3
        actions performed, group1 started, more actions performed
        test that group1 can be either undone or ended, but not re-started or redone
    */
  
    scenario = function(){
        changeBodyColor('red');
        changeBodyColor('green');
        um.startHierarchy('group1');
        changeBodyColor('blue');
        changeBodyColor('red');
    };
    
    standardResults = [4, 0, getBodyColorTitle('red'), null];

    expectedResults = {
        undo: [true, 3, 1, getBodyColorTitle('blue'), getBodyColorTitle('red')],
        redo: [errorNames['redo']], 
        startH1: [true], // should throw debug warning
        endH1: [true],
        undoH1: [true, 2, 2, getBodyColorTitle('green'), getBodyColorTitle('blue')], 
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    };

    concatStandardRes();
    
    failedScenarios['test3'] = getFailedFunctions(expectedResults, scenario);


    /* 
        TEST 4
        one action performed and undone
        test that it can be redone
    */

    scenario = function () {
        changeBodyColor('red');
        um.undo();
    };
    
    standardResults = [0, 1, null, getBodyColorTitle('red')];

    expectedResults = {
        undo: [errorNames['undo']],
        redo: [true, 1, 0, getBodyColorTitle('red'), null],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    };

    concatStandardRes();

    failedScenarios['test4'] = getFailedFunctions(expectedResults, scenario);

    /* 
        TEST 5
        several actions performed, one undone
        test that both redo and undo are possible
    */

    scenario = function () {
        changeBodyColor('red');
        changeBodyColor('green');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo();
    };
    
    standardResults = [3, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')];

    expectedResults = {
        undo: [true, 2, 2, getBodyColorTitle('green'), getBodyColorTitle('blue')],
        redo: [true, 4, 0, getBodyColorTitle('green'), null],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    };  

    concatStandardRes();

    failedScenarios['test5'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 6
        group2 formed (note that 'formed' is not the same as 'started'; formed implies the group
        was started, populated, and ended), action performed, action undone
        test that group2 can be undone
    */

    scenario = function () {
        um.startHierarchy('group2');
        changeBodyColor('red');
        changeBodyColor('green');
        um.endHierarchy('group2');
        changeBodyColor('blue');
        um.undo();  
    }
    
    standardResults = [2, 1, getBodyColorTitle('green'), getBodyColorTitle('blue')];

    expectedResults = {
        undo: [true, 1, 2, getBodyColorTitle('red'), getBodyColorTitle('green')], //TODO make sure this undoes the proper action and group still exists
        redo: [true, 3, 0, getBodyColorTitle('blue'), null],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [true, 0, 3, null, getBodyColorTitle('red')],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    };   

    concatStandardRes();

    failedScenarios['test6'] = getFailedFunctions(expectedResults, scenario);
    

    /*
        TEST 7
        one action performed, undone, and redone
        test that everything still works as if the action were not undone and redone
    */

    scenario = function () {
        changeBodyColor('red');
        um.undo()
          .redo();    
    };
    
    standardResults = [1, 0, getBodyColorTitle('red'), null];

    expectedResults = {
        undo: [true, 0, 1, null, getBodyColorTitle('red')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 
    
    concatStandardRes();

    failedScenarios['test7'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 8
        several actions performed, some (not all) undone, one redone
        test that stack lengths are updating properly
    */

    scenario = function () {
        changeBodyColor('red');
        changeBodyColor('green');
        changeBodyColor('blue');
        changeBodyColor('red');
        um.undo()
          .undo()
          .undo()
          .redo();
    };
    
    standardResults = [2, 2, getBodyColorTitle('green'), getBodyColorTitle('blue')];

    expectedResults = {
        undo: [true, 1, 3, getBodyColorTitle('red'), getBodyColorTitle('green')],
        redo: [true, 3, 1, getBodyColorTitle('blue'), getBodyColorTitle('red')],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 
    
    concatStandardRes();

    failedScenarios['test8'] = getFailedFunctions(expectedResults, scenario);
    
    /*
        TEST  9
        action performed, group3 formed, group3 and previous action undone, first action redone
        test that group3 can be redone (and that first action of the group cannot be individually redone)
    */

    scenario = function () {
        changeBodyColor('red');
        um.startHierarchy('group3');
        changeBodyColor('green');
        changeBodyColor('blue');
        um.endHierarchy('group3')
          .undoHierarchy('group3')
          .undo()
          .redo();
    };
    
    standardResults = [1, 2, getBodyColorTitle('red'), getBodyColorTitle('green')];

    expectedResults = {
        undo: [true, 0, 3, null, getBodyColorTitle('red')], 
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [true, 3, 0, getBodyColorTitle('blue'), null],
    }; 
    
    concatStandardRes();

    failedScenarios['test9'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 10
        group2 started
        test that starting the group can't be undone and that empty groups don't throw errors
    */

    scenario = function () {
            um.startHierarchy('group2');
    };

    standardResults = [0, 0, null, null];
    
    expectedResults = {
        undo: [errorNames['undo']],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true], // should throw debug warning
        endH2: [true], 
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 
    
    concatStandardRes();

    failedScenarios['test10'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 11
        group2 formed, last action in group undone, new action performed
        test that new action is not considered part of group2
    */

    scenario = function () {
        um.startHierarchy('group2');
        changeBodyColor('red');
        changeBodyColor('blue');
        um.endHierarchy('group2')
          .undo();
        changeBodyColor('green');
    };
    
    standardResults = [2, 0, getBodyColorTitle('green'), null];

    expectedResults = {
        undo: [true, 1, 1, getBodyColorTitle('red'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 
    
    concatStandardRes();

    failedScenarios['test11'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 12
        group1 and 2 formed at same time, last action in both groups undone, new action performed
        test that new action is not considered part of either group
    */

    scenario = function () {
        um.startHierarchy('group2')
          .startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        um.endHierarchy('group1')
          .endHierarchy('group2')
          .undo();
        changeBodyColor('green');
    };

    standardResults = [2, 0, getBodyColorTitle('green'), null];

    expectedResults = {
        undo: [true, 1, 1, getBodyColorTitle('red'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes()

    failedScenarios['test12'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 13
        several group2's formed, all undone, then one redone.
        test that more than one group2 can be redone
    */

    scenario = function () {
        um.startHierarchy('group2');
        changeBodyColor('red');
        changeBodyColor('blue');
        um.endHierarchy('group2')
          .startHierarchy('group2');
        changeBodyColor('red');
        changeBodyColor('blue');
        um.endHierarchy('group2')
          .startHierarchy('group2');
        changeBodyColor('red');
        changeBodyColor('blue');
        um.endHierarchy('group2')
          .undoHierarchy('group2')
          .undoHierarchy('group2')
          .undoHierarchy('group2')
          .redoHierarchy('group2');
    };
    
    standardResults = [2, 4, getBodyColorTitle('blue'), getBodyColorTitle('red')];

    expectedResults = {
        undo: [true, 1, 5, getBodyColorTitle('red'), getBodyColorTitle('blue')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [true, 0, 6, null, getBodyColorTitle('red')],
        redoH2: [true, 4, 2, getBodyColorTitle('blue'), getBodyColorTitle('red')],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test13'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 14
        group1 formed, undo all but one through individual undo (won't be able to do individual redo if entire
        group is undone), redo everything through individual redo
        test that redone actions are still in the group
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.endHierarchy('group1')
          .undo()
          .undo()
          .redo()
          .redo();
    };
    
    standardResults = [3, 0, getBodyColorTitle('green'), null];

    expectedResults = {
        undo: [true, 2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [true, 0, 3, null, getBodyColorTitle('red')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test14'] = getFailedFunctions(expectedResults, scenario);
    
    /*
        TEST 15
        Almost identical to Test 14, except the group is not explicitly ended.
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        changeBodyColor('orange');
        um.undo()
          .undo()
          .undo()
          .redo()
          .redo()
          .redo();
    };
    
    standardResults = [4, 0, getBodyColorTitle('orange'), null];

    expectedResults = {
        undo: [true, 3, 1, getBodyColorTitle('green'), getBodyColorTitle('orange')],
        redo: [errorNames['redo']],
        startH1: [true], // should throw debug warning
        endH1: [true],
        undoH1: [true, 0, 4, null, getBodyColorTitle('red')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test15'] = getFailedFunctions(expectedResults, scenario);
    
    /*
        TEST 16
        group1 formed, undo all but one through single undo, redo one action, perform another action
        test that extra performed action isn't considered part of group
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('black');
        um.endHierarchy('group1')
          .undo()
          .undo()
          .redo();
        changeBodyColor('green');
    };

    standardResults = [3, 0, getBodyColorTitle('green'), null];

    expectedResults = {
        undo: [true, 2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test16'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 17
        group1 started, actions performed, last action undone, group ended
        test that undone action can be redone after group ended (and is still part of the group) 
        and that undoing previous action still works
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo()
          .endHierarchy('group1');
        um.redo();
    };
    
    standardResults = [3, 0, getBodyColorTitle('green'), null];

    expectedResults = {
        undo: [true, 2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [true, 0, 3, null, getBodyColorTitle('red')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test17'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 18
        group3 formed, all but one action undone individually, a separate action performed then undone
        test that remaining action is considered all of group3 (i.e. undoing group3 should be posssible)
    */

    scenario = function () {
        um.startHierarchy('group3');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.endHierarchy('group3')
          .undo()
          .undo()
        changeBodyColor('green');
        um.undo();
    };
    
    standardResults = [1, 1, getBodyColorTitle('red'), getBodyColorTitle('green')];

    expectedResults = {
        undo: [true, 0, 2, null, getBodyColorTitle('red')],
        redo: [true, 2, 0, getBodyColorTitle('green'), null],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [true, 0, 2, null, getBodyColorTitle('red')],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();
    failedScenarios['test18'] = getFailedFunctions(expectedResults, scenario);
    
    /*
        TEST 19
        actions performed, group2 formed, group 2 undone, another action undone
        test that group2 cannot be redone from here  //TODO: what's desired for redo group behavior?
    */

    scenario = function () {
        changeBodyColor('red');
        changeBodyColor('blue');
        um.startHierarchy('group2');
        changeBodyColor('green');
        um.endHierarchy('group2')
          .undoHierarchy('group2')
          .undo();
    };
    
    standardResults = [1, 2, getBodyColorTitle('red'), getBodyColorTitle('blue')];

    expectedResults = {
        undo: [true, 0, 3, null, getBodyColorTitle('red')],
        redo: [true, 2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test19'] = getFailedFunctions(expectedResults, scenario);
    
    /*
        TEST 20
        actions performed, group2 formed, another action performed
        test that group2 cannot be undone from here  //TODO: this should match redo behavior
    */

    scenario = function () {
        changeBodyColor('red');
        changeBodyColor('blue');
        um.startHierarchy('group2');
        changeBodyColor('green');
        um.endHierarchy('group2');
        changeBodyColor('red');
    };
    
    standardResults = [4, 0, getBodyColorTitle('red'), null];

    expectedResults = {
        undo: [true, 3, 1, getBodyColorTitle('green'), getBodyColorTitle('red')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test20'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 21
        action performed, empty group2 formed
        test that group2 was not added to the stack (undoing should undo the first action)
    */

    scenario = function () {
        changeBodyColor('red');
        um.startHierarchy('group2')
          .endHierarchy('group2');
    };
    
    standardResults = [1, 0, getBodyColorTitle('red'), null];

    expectedResults = {
        undo: [true, 0, 1, null, getBodyColorTitle('red')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test21'] = getFailedFunctions(expectedResults, scenario);

    /*  
        TEST 22
        group3 formed, all but one action undone individually, group3 undone
        test that redoing group puts it back to the way it was immediately before the undo (i.e. just one action in it)
    */

    scenario = function () {
        um.startHierarchy('group3');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.endHierarchy('group3')
          .undo()
          .undo()
          .undoHierarchy('group3');
    };
    
    standardResults = [0, 3, null, getBodyColorTitle('red')];

    expectedResults = {
        undo: [errorNames['undo']],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [true, 1, 2, getBodyColorTitle('red'), getBodyColorTitle('blue')]
    }; 

    concatStandardRes();

    failedScenarios['test22'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 23
        group1 started, actions performed, last action undone, group ended, action redone, new action performed
        test that new action is not considered part of the group (only the redone action should be part of the group, 
        relevant to Test 16)
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo()
          .endHierarchy('group1');
        um.redo();
        changeBodyColor('purple');
    };
    
    standardResults = [4, 0, getBodyColorTitle('purple'), null];

    expectedResults = {
        undo: [true, 3, 1, getBodyColorTitle('green'), getBodyColorTitle('purple')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test23'] = getFailedFunctions(expectedResults, scenario);    

    /*
        TEST 24
        group1 started, actions performed, last action undone, group ended, action redone,
        new action performed and undone, group undone
        test that redoing the group goes to the proper action (the one that was redone immediately after the group was ended)
        (relevant to Test 23 and 17)
    */
    
    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo()
          .endHierarchy('group1');
        um.redo();
        changeBodyColor('purple');
        um.undo()
          .undoHierarchy('group1');
    };
    
    standardResults = [0, 4, null, getBodyColorTitle('red')];

    expectedResults = {
        undo: [errorNames['undo']],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [true, 3, 1, getBodyColorTitle('green'), getBodyColorTitle('purple')],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test24'] = getFailedFunctions(expectedResults, scenario); 

    /*
        TEST 25
        group1 started, actions performed, group1 started again, actions performed, group1 undone
        test that the first group1 was automatically closed and is recognized as a separate group
    */

    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.startHierarchy('group1');  // should throw debug warning
        changeBodyColor('purple');
        changeBodyColor('orange');
        um.undoHierarchy('group1');
    };
    
    standardResults = [3, 2, getBodyColorTitle('green'), getBodyColorTitle('purple')];

    expectedResults = {
        undo: [true, 2, 3, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [true, 0, 5, null, getBodyColorTitle('red')],
        redoH1: [true, 5, 0, getBodyColorTitle('orange'), null],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test25'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 26
        group3 and group2 started, group3 ended, extra action performed
        test that group2 is automatically closed, the extra action should not be in group2
    */

    scenario = function () {
        um.startHierarchy('group3');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.startHierarchy('group2');
        changeBodyColor('purple');
        changeBodyColor('orange');
        um.endHierarchy('group3');
        changeBodyColor('black');
    };
    
    standardResults = [6, 0, getBodyColorTitle('black'), null];

    expectedResults = {
        undo: [true, 5, 1, getBodyColorTitle('orange'), getBodyColorTitle('black')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test26'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 27
        group1 started, actions performed, group2 started, actions performed, group1 ended, group 2 undone
        test that group1 can still be undone
    */

    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.startHierarchy('group2');
        changeBodyColor('purple');
        changeBodyColor('orange');
        um.endHierarchy('group1');
        um.undoHierarchy('group2');
    };
    
    standardResults = [3, 2, getBodyColorTitle('green'), getBodyColorTitle('purple')];

    expectedResults = {
        undo: [true, 2, 3, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [true, 0, 5, null, getBodyColorTitle('red')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [true, 5, 0, getBodyColorTitle('orange'), null],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();
    failedScenarios['test27'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 28
        group1 started, actions performed, undo last action
        test that group1 can't be redone
    */

    scenario = function () {
        um.startHierarchy('group1');
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo();
    };
    
    standardResults = [2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')];

    expectedResults = {
        undo: [true, 1, 2, getBodyColorTitle('red'), getBodyColorTitle('blue')],
        redo: [true, 3, 0, getBodyColorTitle('green'), null],
        startH1: [true],
        endH1: [true],
        undoH1: [true, 0, 3, null, getBodyColorTitle('red')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test28'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 29
        actions performed, actions undone, group started, actions redone
        test that group no longer exists
    */

    scenario = function () {        
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.undo();
        um.undo();
        um.startHierarchy('group1');
        um.redo();
        um.redo();
        changeBodyColor('black');
    };
    
    standardResults = [4, 0, getBodyColorTitle('black'), null];

    expectedResults = {
        undo: [true, 3, 1, getBodyColorTitle('green'), getBodyColorTitle('black')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test29'] = getFailedFunctions(expectedResults, scenario);

     /*
        TEST 30
        actions performed, group started, actions undone
        test that group no longer exists
    */

    scenario = function () {        
        changeBodyColor('red');
        changeBodyColor('blue');
        changeBodyColor('green');
        um.startHierarchy('group1');
        um.undo();
        um.undo();
    };
    
    standardResults = [1, 2, getBodyColorTitle('red'), getBodyColorTitle('blue')];

    expectedResults = {
        undo: [true, 0, 3, null, getBodyColorTitle('red')],
        redo: [true, 2, 1, getBodyColorTitle('blue'), getBodyColorTitle('green')],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test30'] = getFailedFunctions(expectedResults, scenario);

    /*
        TEST 31
        group2 poulated, group1 started, group2 undone, group1 started, action performed
        test that group1 was ended properly when group2 was undone
        (if not, results show 'internal errors' (recursion errors))
    */

    scenario = function () {
        um.startHierarchy('group2');
        changeBodyColor('red');
        um.endHierarchy('group2');
        um.startHierarchy('group1');
        um.undoHierarchy('group2');
        um.startHierarchy('group1');
        changeBodyColor('blue');
    };
    
    standardResults = [1, 0, getBodyColorTitle('blue'), null];

    expectedResults = {
        undo: [true, 0, 1, null, getBodyColorTitle('blue')],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [true],
        undoH1: [true, 0, 1, null, getBodyColorTitle('blue')],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [errorNames['endH2']],
        undoH2: [errorNames['undoH2']],
        redoH2: [errorNames['redoH2']],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test31'] = getFailedFunctions(expectedResults, scenario);  

    /*
        TEST 32
        Start a group, perform an action, undo that action.
        Test that the action can be redone both through individual redo and group redo.
    */

    scenario = function () {
        um.startHierarchy('group2');
        changeBodyColor('red');
        um.undo();
    };
    
    standardResults = [0, 1, null, getBodyColorTitle('red')];

    expectedResults = {
        undo: [errorNames['undo']],
        redo: [errorNames['redo']],
        startH1: [true],
        endH1: [errorNames['endH1']],
        undoH1: [errorNames['undoH1']],
        redoH1: [errorNames['redoH1']],
        startH2: [true],
        endH2: [true],
        undoH2: [errorNames['undoH2']],
        redoH2: [true, 1, 0, getBodyColorTitle('red'), null],
        startH3: [true],
        endH3: [errorNames['endH3']],
        undoH3: [errorNames['undoH3']],
        redoH3: [errorNames['redoH3']]
    }; 

    concatStandardRes();

    failedScenarios['test32'] = getFailedFunctions(expectedResults, scenario);      

    var nonEmptyFailedScenarios = {}; //will hold values from failedScenarios that aren't just empty arrays

    //populate nonEmptyFailedScenarios and figure out whether all the tests passed or not
    var passed = true;
    for (var key in failedScenarios){
        if (failedScenarios[key].length !== 0){
            nonEmptyFailedScenarios[key] = failedScenarios[key]
            passed = false;
        }
    }

    //display either the tests that failed or text that says the tests passed
    if (passed){
        console.log("All tests passed!");
    }
    else{
        console.log(nonEmptyFailedScenarios);
    }
};


    //TODO
    //store statistics about actions 
    //esp when people record and state before and after recording
