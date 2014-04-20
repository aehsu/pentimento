pentimento = {};
INTERVAL_TIMING = 50; //in ms for any intervals that need to be set in the code
DEBUG = true;

function global_time() {
    return (new Date()).getTime();
}

$(document).ready(function(){
    var iw = $(window).width();
    var ih = $(window).height();
    $('#sketchpad')[0].width = 0.8 * iw;
    $('#sketchpad')[0].height = 0.8 * ih;

    $('#slider').width($('canvas').width());
    $('#ticker').css('position', 'absolute'); //so many bad things.
    $('#ticker').css('left', parseInt($('#slider').width())+20 + 'px'); //holy shit.
    $('#ticker').css('top', parseInt($('#slider').position().top)-10 + 'px'); //oh god.
    //temporary one-time off's to do initialization correctly..."correctly"
});