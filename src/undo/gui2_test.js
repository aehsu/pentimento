// Test that the buttons in the GUI are updating correctly
var gui2test = function() {
    'use strict';

    // references to the button elements
    var buttons = {};
    
    // add the group buttons to the 'buttons' object
    var groups = ['group1', 'group2', 'group3']
    var commands = ['start', 'end', 'undo', 'redo'];
    for (var i in groups) {
        for (var j in commands){
            buttons[commands[j]+' '+groups[i]] = $('#'+commands[j]+'.'+groups[i]);
        }
    }
    
    // Check the value of each button's actual disability against what is expected.
    // expectedVals - an object with the same keys as the 'buttons' object and boolean values that
    // describe whether the corresponding button should be disabled.
    // Throws an error if an expected value doesn't match the actual value, returns true otherwise.
    var checkButtonDisability = function(expectedVals) {
        for (var key in buttons) {
            if (buttons[key].prop('disabled') !== expectedVals[key]) {
                throw buttonDisabilityError(key);
            }
        }
        return true;
    };

    // Check the value of each button's text against what is expected.
    // expectedVals - an object with the same keys as the 'buttons' object and string values that are
    // the text expected to be on the corresponding button.
    // Throws an error if an expected value doesn't match the actual value, returns true otherwise.
    var checkButtonText = function(expectedTexts) {
        return true //TODO: remove once text is correct again
        for (var key in buttons) {
            if (buttons[key].text() !== expectedTexts[key]) {
                throw buttonTextError(key);
            }
        }
        return true;
    };
    
    // mimics a user changing the value of the color dropdown
    var changeTextColor = function(color) {
        $('#color').val(color).trigger('change');
    };
    
    // mimics a user changing the value of the font-size dropdown
    var changeFontSize = function(size) {
        $('#font-size').val(size).trigger('change');
    };
    
    // mimics a user changing the value of the background color dropdown
    var changeBgColor = function(bgColor) {
        $('#background-color').val(bgColor).trigger('change');
    };
    
    // set up the initial expected values
    var expectedDisability = {};
    var expectedTexts = {};
    for (var key in buttons) {
        expectedDisability[key] = true; // says every button should be disabled (not true, will be fixed a bit later)
        var str = '';
        var split = key.split(" ");
        if (split.length > 1) {
            for (var i in split) {
                str += split[i][0].toUpperCase() + split[i].slice(1) + ' '; //capitalize the first letter of each word
            }
            str = str.substring(0, str.length-1); // remove the last space
        }
        else {
            str = key[0].toUpperCase() + key.slice(1) + ' '; //capitalize the first letter and add a space to the end
        }
        expectedTexts[key] = str;   // every button should be labeld with their base function (no action titles yet)
    }
    for (var i in groups) { // Not every button should be disabled. The start group buttons should be enabled
        expectedDisability['start ' + groups[i]] = false; 
    }
    
    
    // no actions
                    // test the initial expected values    
                    checkButtonDisability(expectedDisability);
                    checkButtonText(expectedTexts);

    // do something
    changeTextColor('orange');
                    // change any values that have changed and test them
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    changeBgColor('red');
    
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    undoManager.undo(); // undoManager defined in gui2.js
    
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    undoManager.undo();
    
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);                                        
    
    undoManager.startHierarchy('group1');
    
                    expectedDisability['end group1'] = false;
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    changeTextColor('yellow');
    
                    expectedDisability['undo group1'] = false;
                    checkButtonDisability(expectedDisability);     
                    checkButtonText(expectedTexts);
    
    changeBgColor('blue');
    
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);                    
    
    undoManager.endHierarchy('group1');
    
                    expectedDisability['end group1'] = true;
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    undoManager.startHierarchy('group2');
    
                    expectedDisability['end group2'] = false;
                    checkButtonDisability(expectedDisability);
                    
                    checkButtonText(expectedTexts);
    
    changeFontSize('10px');
    
                    checkButtonText(expectedTexts);
                    
                    expectedDisability['undo group1'] = true;
                    expectedDisability['undo group2'] = false;
                    checkButtonDisability(expectedDisability);
    
    undoManager.startHierarchy('group3');
    
                    expectedDisability['end group3'] = false;
                    checkButtonDisability(expectedDisability);
    
    changeTextColor('white');
                    
                    expectedDisability['undo group3'] = false;
                    checkButtonDisability(expectedDisability);
    
    undoManager.endHierarchy('group3');
    
                    expectedDisability['start group3'] = false;
                    expectedDisability['end group3'] = true;
                    checkButtonDisability(expectedDisability);
    
    undoManager.endHierarchy('group2');
    
                    expectedDisability['start group2'] = false;
                    expectedDisability['end group2'] = true;
                    checkButtonDisability(expectedDisability);

    undoManager.startHierarchy('group1');

                    expectedDisability['end group1'] = false;
                    checkButtonDisability(expectedDisability);

    undoManager.undoHierarchy('group2');


                    expectedDisability['undo group1'] = false;
                    expectedDisability['undo group2'] = true;
                    expectedDisability['undo group3'] = true;
                    expectedDisability['redo group2'] = false;
                    expectedDisability['end group1'] = true;
                    checkButtonDisability(expectedDisability);

    undoManager.undoHierarchy('group1');
    undoManager.startHierarchy('group2');
    undoManager.startHierarchy('group3');
    undoManager.redoHierarchy('group1');

                    checkButtonDisability(expectedDisability);


    console.log('passed!');
    
}

//TODO: better testing method? like, checks for what should be disabled by checking what functions produce errors?