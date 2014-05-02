pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var slide_begin = NaN;
    var dirty_visuals = [];
    var dirty_times = [];
    var insertion_index = null;
    
    function endSlide(time, slide) {
        console.log('ending slide at', time);
        state.current_slide.duration += time - slide_begin;
        if(dirty_visuals.length > 0) {
            for(var vis in dirty_visuals) {
                dirty_visuals[vis].tMin = dirty_times[vis];
            }
            pentimento.lecture_controller.visuals_controller.shiftVisuals(dirty_visuals, time - slide_begin);
            dirty_times = [];
            dirty_visuals = [];
            insertion_index = null;
        }
        
        slide_begin = NaN;
    }
    
    function unaddSlide(prev_slide, new_slide) {
        //simply unadd's a slide, but is not the same as deleting a slide!
        //unadding is the opposite of adding a slide, but deleting a slide can be done outside of a recording
        //refer to lecture controller for slide deletion
        if(new_slide != state.current_slide) { console.log('Error in unadding a slide!'); }
        var index = pentimento.lecture_controller.deleteSlide(new_slide);
        var duration = 0;
        var slide_iter = pentimento.lecture_controller.get_lecture_accessor();
        
        while(slide_iter.hasNext()) {
            var slide = slide_iter.next();
            if(slide_iter.index == index) { break; }
            duration+= slide.access().duration();
        }
        pentimento.time_controller.update_time(duration);
        slide_begin = global_time();
        
        um.add(function() {
            self.addSlide();
        }, ActionGroups.Recording_Group);
    }

    this.addSlide = function() {
        //adding a slide does not start a group! to undo a slide's addition, you must undo all actions leading upto it
        slide_begin = global_time();
        if(state.current_slide) { endSlide(slide_begin, state.current_slide); } //only end the current_slide if not undefined and not null
        var prev_slide = state.current_slide;
        var new_slide = new Slide();
        pentimento.lecture_controller.addSlide(new_slide);
        state.current_slide = next_slide;
        
        um.add(function() {
            unaddSlide(prev_slide, new_slide);
        }, ActionGroups.Recording_Group);
    }

    this.addVisual = function(visual) {
        for(var vert in visual.vertices) {
            visual.vertices[vert].t -= slide_begin;
        }
        visual.tMin -= slide_begin;
        pentimento.lecture_controller.visuals_controller.addVisual(state.current_slide, visual, insertion_index);
    }
    
    this.beginRedrawing = function() {
        if(!state.current_slide) {
            console.log("this should never, ever happen");
            return; 
        }
        um.startHierarchy(ActionGroups.Recording_Group);
        pentimento.lecture_controller.visuals_controller.deleteVisuals(state.selection);
        //somehow get the earliest time!
        var visuals_iter = state.current_slide.access().visuals();
        while(visuals_iter.hasNext()) {
            var visual = visuals_iter.next();
            if(state.selection.indexOf(visual) >= 0 && insertion_index == null) {
                insertion_index = visuals_iter.index;
            } else if(visual.access().tMin() > state.current_time) {
                dirty_visuals.push(visual);
            }
        }
        
        
        for(var vis in dirty_visuals) { //alternatively, set interval for shifting as you go
            dirty_times.push(dirty_visuals[vis].access().tMin());
            dirty_visuals[vis].tMin = NaN; //temporary disabling of the visuals.
        }
        
        slide_begin = global_time();
        pentimento.time_controller.begin_recording(slide_begin);
        pentimento.state.is_recording = true;
    }
    
	this.beginRecording = function() {
//        pentimento.state.selection=[]; //selection??? what to do with it?
//        pentimento.visuals_controller.update_visuals(true);
//        pentimento.time_controller.update_time(pentimento.state.current_time);//why is this here??
        
        if(!state.current_slide) {
            console.log("this should never, ever happen");
            return;
        }
        
        var visuals_iter = state.current_slide.access().visuals();
        while(visuals_iter.hasNext()) {
            var visual = visuals_iter.next();
            if(visual.access().tMin() > state.current_time) { //is dirty
                if(insertion_index == null) {insertion_index = visuals_iter.index;}
                dirty_visuals.push(visual);//splice them out?? nahh
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

	this.stopRecording = function() {
        var gt = global_time();
        endSlide(gt);
        pentimento.state.is_recording = false;
        pentimento.time_controller.stop_recording(gt);
        um.endHierarchy(ActionGroups.Recording_Group);
        
        slide_begin = NaN;
	}
};