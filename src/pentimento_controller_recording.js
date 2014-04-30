pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
    var interval = null;
    var slide_begin = NaN;
    var state = pentimento.state;
    var dirty_visuals = [];
    var dirty_times = [];
    var dirty_idx = null;
    var is_redraw = false;
    
    function end_slide(time) {
        console.log('ending slide at', time);
        state.current_slide.duration += time - slide_begin;
        if(dirty_visuals.length > 0) {
            for(var vis in dirty_visuals) {
                dirty_visuals[vis].tMin = dirty_times[vis];
            }
            pentimento.lecture_controller.visuals_controller.shift_visuals(dirty_visuals, time - slide_begin);
            dirty_times = [];
            dirty_visuals = [];
            dirty_idx = null;
        }
        
        slide_begin = NaN;
    }

    this.add_slide = function() {
        slide_begin = global_time();
        if(state.current_slide) { end_slide(slide_begin); } //only end the current_slide if not undefined and not null
        state.current_slide = new Slide();
        pentimento.lecture_controller.add_slide(state.current_slide);
    }

    this.add_visual = function(visual) {
        if(!is_redraw) {
            pentimento.lecture_controller.visuals_controller.add_visual(state.current_slide, visual, dirty_idx);
        } else {
            
        }
    }
    
	this.begin_recording = function() {
//        pentimento.state.selection=[]; //selection??? what to do with it?
//        pentimento.visuals_controller.update_visuals(true);
//        pentimento.time_controller.update_time(pentimento.state.current_time);//why is this here??
        
        if(!state.current_slide) {
            this.add_slide();
            console.log("this should never, ever happen");
        } else {
            var visuals_iter = state.current_slide.access().visuals();
            while(visuals_iter.hasNext()) {
                var visual = visuals_iter.next();
                if(visual.access().tMin() > state.current_time) { //is dirty
                    if(dirty_idx == null) {dirty_idx = visuals_iter.index;}
                    dirty_visuals.push(visual);//splice them out?? nahh
                }
            }
        }
        
        for(var vis in dirty_visuals) { //alternatively, set interval for shifting as you go
            dirty_times.push(dirty_visuals[vis].access().tMin());
            dirty_visuals[vis].tMin = NaN; //temporary disabling of the visuals.
        }
        
        um.startHierarchy(ActionGroups.Recording_Group);
        slide_begin = global_time();
        console.log('beginning recording at', slide_begin);
        pentimento.time_controller.begin_recording(slide_begin);
        pentimento.state.is_recording = true;
	}

	this.stop_recording = function() {
        var gt = global_time();
        end_slide(gt);
        pentimento.state.is_recording = false;
        pentimento.time_controller.stop_recording(gt);
        um.endHierarchy(ActionGroups.Recording_Group);
        
        slide_begin = NaN;
	}
};