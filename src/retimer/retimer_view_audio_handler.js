/* TODO:
    1) Actually sync audio with main window
    2) figure out global time for resetting stuff
    3) Redo the UI here to sync it
    4) update the constraints stuff (e.g. extending the constraints canvas) to sync with audio AND visuals

*/

function displayAudio(){

    console.log("audiodisplaying?")
    // var timelineID = window.retimer_window.$("#audio_div");

    window.opener.pentimento.audioController.draw("retimer");


    /*console.log("here?");
    if(window.opener != null){
        console.log("UPDATING!");
        var original_height = window.opener.jQuery("[id=audio_timeline]").height();
        var original_width = window.opener.jQuery("[id=audio_timeline]").width();
        var retimer_audio_height = $('#audio_div').height();

        var scale = retimer_audio_height/original_height;

        var audio_display = window.opener.jQuery("[id=audio_timeline]").html();

        var new_width = original_width * scale

        $('#audio_div').html(audio_display);
        // $('#audio_div').height(retimer_audio_height);
        // $('#audio_div').width(new_width);

        scaleAudioDisplay($('#audio_div'), scale);

        // $("#audio_div").children().each(function() {
        //     console.log("HEREEEEE");
        //     var curr_height =  $(this).height();
        //     var curr_width = $(this).width();

        //     console.log("curr_height: " + curr_height);

        //     var scaled_height = curr_height * scale;

        //     console.log("scaled_h: " + scaled_height);
        //     var scaled_width = curr_width * scale;
        //     $(this).height(scaled_height);

        //     console.log("height? " + $(this).height());

        //     $(this).width(scaled_width);
        //  });

        console.log("retimer html: " + $('#audio_div').html());
    }*/
}

function scaleAudioDisplay(parent, scale){
    $(parent).children().each(function() {
        console.log("HEREEEEE");
        var curr_height =  $(this).height();
        var curr_width = $(this).width();

        console.log("curr_height: " + curr_height);

        var scaled_height = curr_height * scale;

        console.log("scaled_h: " + scaled_height);
        var scaled_width = curr_width * scale;
        $(this).height(scaled_height);

        console.log("height? " + $(this).height());

        $(this).width(scaled_width);

        scaleAudioDisplay($(this), scale);
    });
}