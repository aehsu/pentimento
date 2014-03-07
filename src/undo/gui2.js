var undoManager; // will hold the undoManager object. Global so gui2_test.js can access it.

$(document).ready(function(){
    'use strict';

    // Returns a string of HTML that represents a dropdown element.
    // list - an array of values to place in the dropdown
    // id - the id name of the dropdown
    var createDropdown = function(list, id) {
        var dropdown = "<select id='" + id + "'>";
        for (var i in list) {
            dropdown += "<option value='" + list[i] + "'>" + list[i] + "</option>";
        }
        dropdown += "</select>";
        return dropdown;
    };

    // Replace the text "textColorDropdown", "bgColorDropdown", and "sizeDropdown" with corresponding dropdowns

    var colors = ['black', 'white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple']; // the colors in the color dropdowns
    // get the HTML for the textColor and bgColor dropdowns
    var textColorDropdown = createDropdown(colors, 'color');
    var bgColorDropdown = createDropdown(colors, 'background-color');
    
    // create a list for the font size dropdown
    var sizes = ['0px'];
    for (var i = 10; i < 61; i ++) {
        sizes.push(i+'px');
    }
    var sizeDropdown = createDropdown(sizes, 'font-size'); // get the HTML for the dropdown
    
    // replace the specified text with the corresponding dropdowns
    var origHTML = $('#edit-controls').html();
    var newHTML = origHTML.replace("textColorDropdown", textColorDropdown);
    newHTML = newHTML.replace("bgColorDropdown", bgColorDropdown);
    newHTML = newHTML.replace("sizeDropdown", sizeDropdown);   
    $('#edit-controls').html(newHTML);
    
    // set the selected values in the dropdowns to match the css values
    var example = $('#example-text');
    var ids = ['color', 'font-size', 'background-color'];
    for (var i in ids) {
        var id = ids[i];
        var defaultVal = example.css(id);
        if (id === 'font-size') {
            $('#'+id).val(defaultVal);
        }
        else {
            $('#'+id).val(rgbNames[defaultVal]);
        }
    }

    // Disable or enable a button.
    // Very specific to the current HTML.
    // group - the group the button corresponds to
    // mode - the function the button performs
    // enabled - boolean as to whether the button should be enabled or not
    var setButtonDisability = function(group, mode, enabled) {
        var button;
        // if the group is null, get the individual undo or redo button
        if (group === 'null' || isNull(group)) {
            button = $('.'+mode);
        }
        else {
            button = $('#'+mode+'.'+group); //the HTML is set up so that the id is the mode and the class is the group
        }
        button.prop('disabled', !enabled); // set the disabled property of the button to the appropriate value
    };

    // create an undoManager with 3 groups
    var groups = ['group1', 'group2', 'group3'];
    undoManager = getUndoManager(groups, true);

    // Disable the undoManager-related buttons that should be disabled before any actions are taken
    // (i.e. all buttons except the ones that start groups)
    groups.push(null);
    var modes = ['undo', 'redo', 'end'];
    for (var i in groups) {
        for (var j in modes) {
            setButtonDisability(groups[i], modes[j], false);
        }
    }

    // create and register the event listeners

    // changes the titles of the undo and redo buttons
    var changeTitles = function(evt) {
        $('.undo').html("Undo " + evt.undoTitle);
        $('.redo').html("Redo " + evt.redoTitle);
    };
    undoManager.addListener('actionPerformed', changeTitles);
    undoManager.addListener('actionUndone', changeTitles);
    undoManager.addListener('actionRedone', changeTitles);

    // disables/enables the undo button for a particular group (or just the individual undo button, if the group is null)
    var setUndoDisability = function(evt) {
        setButtonDisability(evt.group, 'undo', evt.enabled);
    };
    undoManager.addListener('undoStatusChange', setUndoDisability);

    // disables/enables the redo button for a particular group (or just the individual redo button, if the group is null)
    var setRedoDisability = function(evt) {
        setButtonDisability(evt.group, 'redo', evt.enabled);
    };
    undoManager.addListener('redoStatusChange', setRedoDisability);

    // disables the end button for a particular group
    var disableEnd = function(evt) {
        setButtonDisability(evt.group, 'end', false);
    };
    undoManager.addListener('groupEnded', disableEnd);

    // enables the end button for a particular group
    var enableEnd = function(evt) {
        setButtonDisability(evt.group, 'end', true);
    };
    undoManager.addListener('groupStarted', enableEnd);

    // Set up the event handler for the dropdowns. Changing the value changes the corresponding css value
    // for the example text.
    $('select').on('change', function(){
        var prop = $(this).attr('id');
        var newVal = $(this).val();
        var origVal;
        if (prop === 'font-size') {
            origVal = $('#example-text').css(prop);
        }
        else {
            origVal = rgbNames[$('#example-text').css(prop)];
        }
        $('#example-text').css(prop, newVal); // change the css to the new dropdown value
        
        var inverse = function() {
            $('#'+prop).val(origVal).trigger('change');
        };
        var undoTitle = prop + ": " + newVal;
        var redoTitle = prop + ": " + origVal;
        undoManager.add(inverse, undoTitle, redoTitle); // register the action with the undoManager
    });

    
    // Maps button ids to their corresponding undoManager function
    var functions = {
        undo: undoManager.undoHierarchy,
        redo: undoManager.redoHierarchy,
        start: undoManager.startHierarchy,
        end: undoManager.endHierarchy
    };
    
    // Set up the event handler for the buttons. Clicking on them calls the corresponding undoManager function.
    $('button').on('click', function() {
        var className = $(this).attr('class');
        if (className === 'undo') { // the individual undo button was clicked
            undoManager.undo();
        }
        else if (className === 'redo') { // the individual redo button was clicked
            undoManager.redo();
        }
        else{    // figure out what function should be called by looking up the id in the functions object
            var id = $(this).attr('id'); 
            functions[id](className);
        }
    });
});