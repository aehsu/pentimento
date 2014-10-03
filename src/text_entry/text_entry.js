$(document).ready(function(){
        
    //Selection helper from StackOverflow (http://stackoverflow.com/questions/5379120/get-the-highlighted-selected-text)
    function getSelectionText() {
        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {  //For IE <= 8
            text = document.selection.createRange().text;
        }
        return text;
    };
    
    //Selection helper from StackOverflow (http://stackoverflow.com/questions/1335252/how-can-i-get-the-dom-element-which-contains-the-current-selection)
    function getSelectedNode() {
        if (document.selection)
            return document.selection.createRange().parentElement();
        else
        {
            var selection = window.getSelection();
            if (selection.rangeCount > 0)
                return selection.getRangeAt(0).startContainer.parentNode;
        }
    };
        
    //Add options to the font-size dropdown
    var font_size_range = [2, 30, 2]  // [min value (inclusive), max value (inclusive), interval]
    var current_font_size = 12; // default to this value if an option for it is created
    var font_size_options = "";
    for (var i = font_size_range[0]; i <= font_size_range[1]; i += font_size_range[2]){
        if (i === current_font_size){
            font_size_options += "<option value='" + i + "' selected='selected'>" + i + "</option>";
        }
        else {
            font_size_options += "<option value='" + i + "'>" + i + "</option>";
        }
    }
    $("#font_size").html(font_size_options);
    
    
    $("#font_size").change(function() {
            var orig_text = $(getSelectedNode()).text();
            new_text = orig_text.replace(getSelectionText(), "<span style='font-size:"+60+"px'>" + getSelectionText() + "</span>");
            $(getSelectedNode()).html(new_text); // If you use .text instead of.html, the span shows up as plaintext.
    });
        
    $('#place_box').prop('disabled', false);
    placing_box = false;
    $('#place_box').click(function(e){
            $(this).prop('disabled', true);
            placing_box = true;
            e.stopPropagation();
    });
    
    var textbox_id = 0;
    
    //keep in mind that body doesn't always fill the screen,
    //so this might seem broken if you're not actually clicking in the body.
    //Eventually, a canvas should be used instead of body.
    $('body').on('click', function(e){
            if (placing_box) {
                //var text_elem = document.createElement('textarea');
                //$(text_elem).prop('placeholder', 'empty textbox');
                var div_elem = document.createElement('div')
                $(div_elem).prop("id", "textbox_"+textbox_id);
                textbox_id++;
                $(div_elem).css('position', 'absolute').css('left', e.pageX+'px').css('top', e.pageY+'px');
                $(div_elem).append("text");
                $('#text_canvas').append(div_elem);
                //$(text_elem).focus();
                placing_box = false;
                $('#place_box').prop('disabled', false);
            }
    });
    
    //Toggle between display-mode and edit-mode styles for the textareas
    //The positioning stuff keeps the text in the same place when the border is removed/added
    var top_border = 1;
    var left_border = 1;
    $(document).on('focus', 'textarea', function(e){
            if ($(this).hasClass('display-mode')){ // it won't have this class when it's first created, don't want to move the position then
                    $(this).removeClass('display-mode');
                    $(this).parent().css('left', $(this).parent().offset().left-left_border+'px');
                    $(this).parent().css('top', $(this).parent().offset().top-top_border+'px');
            }
        }).on('blur', 'textarea', function(e){
            $(this).addClass('display-mode');
            $(this).parent().css('left', $(this).parent().offset().left+left_border+'px');
            $(this).parent().css('top', $(this).parent().offset().top+top_border+'px');
    });
    
    /*$(document).on('keydown', function(e){
        var selection = $('body').getSelection();
        console.log(new String(selection));
    });*/
    
    

    
});
