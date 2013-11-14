pentimento.lecture_controller = function() {
    var slide_controller = function(live_slide) {
        var slide = live_slide;
        pentimento.state.current_slide = live_slide;

        this.add_visual = function(visual) {
            slide.visuals.append(visual);
        }
    };

    var lecture = new pentimento.lecture();
    var slide_control = new slide_controller(lecture.add_slide());
    
    this.add_visual = function(visual) {
        slide_control.add_visual(visual);
    };
};
