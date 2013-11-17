pentimento.lecture_controller = new function() {
    var lecture;
    var slide_control;

    function slide_controller(live_slide) {
        var slide = live_slide;
        pentimento.state.current_slide = live_slide;

        this.add_visual = function(visual) {
            slide.visuals.push(visual);
        }
    };

    //move to elsewhere? high level function?
    function slide() {
        this.begin_time = null; //unnecessary??
        this.end_time = null;
        this.visuals = [];
        this.current_time = null;

        this.add_visual = function(visual) {
            this.VISUALS.push(visual);
        }
        this.get_visuals = function() {
            return this.VISUALS;
        }
        this.get_visual_by_index = function(index) {
            return this.VISUALS[index];
        }
        this.insert_visual_at_index = function(visual, index) {

        }
        this.insert_visual_at_time = function(visual, t_audio) { //t_audio, t_visual?

        }
    };

    function slide_change(from_page, to_page, t_audio) { //should this live with t_audio????
        this.from_page = from_page;
        this.to_page = to_page;
        this.t_audio = t_audio;
    };

    this.add_slide = function() {
        var new_slide = new slide();
        lecture.slides.push(new_slide);
        //pentimento.state.change_state('current_slide', new_slide);
        return new_slide;
    };

    this.insert_slide = function() {
        var new_slide = new slide();
        var before_index = this.slides.indexOf(pentimento.state.current_slide);
        slides.insert(before_index+1, new_slide);
        //pentimento.state.change_state('current_slide', new_slide);
        return new_slide;
    };

    this.add_visual = function(visual) {
        slide_control.add_visual(visual);
        console.log(visual);
        console.log(lecture);
        console.log(slide_control);
    };

    lecture = new pentimento.lecture();
    console.log('lecture created');
    slide_control = new slide_controller(this.add_slide());
};
