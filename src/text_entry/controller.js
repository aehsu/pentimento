$(document).ready(function() {
    var model = getTextModel();     
    
    var getCharIndex = function() {
        return getSelectionStart();
    };
    
    var insertChar = function(character) {
        var abs_time = pentimento.timeController.getTime();
        var rel_time;
        if (getCharIndex() == 0) {
            rel_time = abs_time;
        } else {
            rel_time = abs_time - model.getAbsTime(getCharIndex()-1);
        } 
        model.insertChar(character, rel_time, {}, getCharIndex());
    };
    
    $("#text_canvas").keydown(function(e) {
        /* 
           For non-printable keys, e.key is the name of the key
           like "Tab" or "Backspace". So, if e.key is only one 
           character long, it's a printable symbol. "Enter" is 
           the only iffy case, but I don't think it needs to be 
           added to the model. It depends on what the renderer needs.
        */
        //TODO: Actually, e.key is supper incompatible. 
        //Only Firefox and IE >= 0 support it. Make browser compatible later.
        if (e.key.length == 1) {
            insertChar(e.key);
        }
        if (e.key === "Backspace") {
            range = [getSelectionStart(), getSelectionEnd()]
            if (range[0] === range[1]) {
                model.deleteCharPerm(range[0] - 1);
            } else {
                range.sort();
                for (var i = range[0]; i < range[1]-1 + 1; i++) {
                    // Delete at range[0] each time, rather than i,
                    // because when one is deleted, the next one falls
                    // into the position of the deleted one.
                    model.deleteCharPerm(range[0]);
                }
            }
        }
        console.log(model.getChars());
    });
});
