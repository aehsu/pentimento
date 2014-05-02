pentimento.recording_controller = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var slide_begin = NaN;
    var dirty_visuals = [];
    var insertion_index = null;
    
    function MakeDirtyVisual(visual) {
        this.visual = visual;
        this.tMin = visual.access().tMin();
        visual.tMin = NaN;
    }
    
    function endSlide(time, slide) {
        console.log('ending slide at', time);
        state.current_slide.duration += time - slide_begin;
        slide_begin = NaN;
    }
    
    function unaddSlide(prev_slide, new_slide, index) {
        //simply unadd's a slide, but is not the same as deleting a slide!
        //unadding is the opposite of adding a slide, but deleting a slide can be done outside of a recording
        //refer to lecture controller for slide deletion
        if(new_slide != state.current_slide) { console.log('Error in unadding a slide!'); }
        state.current_slide = prev_slide;
        pentimento.lecture_controller.deleteSlide(new_slide);
        var duration = 0;
        var slide_iter = pentimento.lecture_controller.get_lecture_accessor();
        
        while(slide_iter.hasNext()) {
            var slide = slide_iter.next();
            if(slide_iter.index == index) { break; }
            duration+= slide.access().duration();
        }
        slide_begin = global_time();
        pentimento.time_controller.updateTime(duration);
        pentimento.lecture_controller.visuals_controller.updateVisuals();
        
        um.add(function() {
            self.addSlide(new_slide);
        }, ActionTitles.AdditionOfSlide);
    }

    this.addSlide = function(slide) {
        //adding a slide does not start a group! to undo a slide's addition, you must undo all actions leading upto it
        slide_begin = global_time();
        if(state.current_slide) { endSlide(slide_begin, state.current_slide); } //only end the current_slide if not undefined and not null
        var prev_slide = state.current_slide;
        var new_slide;
        if(slide) {
            new_slide = slide;
        } else {
            new_slide = new Slide();
        }
        var index = pentimento.lecture_controller.addSlide(new_slide);
        state.current_slide = new_slide;
        
        um.add(function() {
            unaddSlide(prev_slide, new_slide, index);
        }, ActionTitles.AdditionOfSlide);
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
        if(!state.current_slide) {
            console.log("this should never, ever happen");
            return;
        }
        
        var visuals_iter = state.current_slide.access().visuals();
        while(visuals_iter.hasNext()) {
            var visual = visuals_iter.next();
            if(visual.access().tMin() > state.current_time) { //is dirty
                if(insertion_index == null) {insertion_index = visuals_iter.index;}
                dirty_visuals.push(new MakeDirtyVisual(visual));
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