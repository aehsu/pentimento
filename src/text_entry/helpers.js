// incompatible for IE < 9
var getSelectionStart = function() {
    selection = window.getSelection();
    return selection.anchorOffset;
};

// incompatible for IE < 9
var getSelectionEnd = function() {
    selection = window.getSelection();
    return selection.focusOffset;
};
            
