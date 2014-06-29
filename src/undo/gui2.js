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
        setButtonDisability(groups[i], 'start', true);
    }

    // create and register the event listeners

    // checks if each group can be undone, changes the corresponding buttons as necessary
    var checkUndo = function() {
        for (var i in groups) {
            var group = groups[i];
            var title = undoManager.canUndo(group);
            var enabled = true;
            if (title === false) {
                enabled = false;
                title = group;
            }
            setButtonDisability(group, 'undo', enabled);
            $('#undo.'+group).text('Undo ' + title);
        }
    }
    undoManager.addListener('groupStatusChange', checkUndo);
    undoManager.addListener('actionDone', checkUndo);
    undoManager.addListener('operationDone', checkUndo);

    //TODO: consider firing separate events for different groups
    // checks if each group can be redone, changes the corresponding buttons as necessary
    var checkRedo = function() {
        for (var i in groups) {
            var group = groups[i];
            var title = undoManager.canRedo(group);
            var enabled = true;
            if (title === false) {
                enabled = false;
                title = group;
            }
            setButtonDisability(group, 'redo', enabled);
            $('#redo.'+group).text('Redo ' + title);
        }
    }
    undoManager.addListener('operationDone', checkRedo);
    undoManager.addListener('actionDone', checkRedo);

    // enables or disables the end button for each group as necessary
    var changeGroupStatus = function() {
        for (var i in groups) {
            var group = groups[i];
            var enabled = true;
            if (!undoManager.isGroupOpen(group)) {
                enabled = false;
            }
            setButtonDisability(group, 'end', enabled);
        }
    }
    undoManager.addListener('groupStatusChange', changeGroupStatus);
    undoManager.addListener('operationDone', changeGroupStatus); // sometimes groups are auto-closed during undo/redo

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
        var undoTitle = prop;// + ": " + newVal;
        var redoTitle = prop;// + ": " + origVal;
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