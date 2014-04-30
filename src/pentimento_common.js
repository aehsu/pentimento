pentimento = {};
INTERVAL_TIMING = 50; //in ms for any intervals that need to be set in the code
DIRTY_TIMING = 250;
DEBUG = true;
ActionGroups = {
    Visual_Group: "Visual_Group",
    Audio_Group: "Audio_Group",
    Recording_Group: "Recording_Group"
};
um = getUndoManager([ActionGroups.Recording_Group, ActionGroups.Visual_Group, ActionGroups.Audio_Group], DEBUG);

function global_time() {
    return (new Date()).getTime();
}

function draw_visual(visual_access) {
    switch(visual_access.type()) {
        case VisualTypes.basic:
            console.log("someone actually made a basic type?!",visual_accessor);
            break;
        case VisualTypes.stroke:
            var verts_iter = visual_access.vertices();
            var prev;
            if(verts_iter.hasNext()) {
                prev = verts_iter.next();
            }
            while (verts_iter.hasNext()) {
                var curr = verts_iter.next();
                var line = new Segment(prev, curr, visual_access.properties());
                draw_line(line);
                prev = curr;
            }
            break;
        case VisualTypes.dot:
            break;
        case VisualTypes.img:
            break;
    }
}

function Iterator(array) {
    return {
        index: -1,
        hasNext: function() { return this.index < array.length-1; },
        next: function() {
            if(this.hasNext()) {
                this.index = this.index + 1;
                return array[this.index];
            }
            return null;
        }        
    };
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