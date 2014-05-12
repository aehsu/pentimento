pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var slideBegin = NaN;
    var dirtyVisuals = [];
    var insertionIndex = null;
    
    function MakeDirtyVisual(visual) {
        this.visual = visual;
        this.tMin = visual.access().tMin();
        visual.tMin = NaN;
    }
    
    function endSlide(time, slide) {
        console.log('ending slide at', time);
        state.currentSlide.duration += time - slideBegin;
        slideBegin = NaN;
    }
    
    function unaddSlide(prevSlide, newSlide, index) {
        //simply unadd's a slide, but is not the same as deleting a slide!
        //unadding is the opposite of adding a slide, but deleting a slide can be done outside of a recording
        //refer to lecture controller for slide deletion
        if(newSlide != state.currentSlide) { console.log('Error in unadding a slide!'); }
        state.currentSlide = prevSlide;
        pentimento.lectureController.deleteSlide(newSlide);
        var duration = 0;
        var slideIter = pentimento.lectureController.getLectureAccessor();
        
        while(slideIter.hasNext()) {
            var slide = slideIter.next();
            if(slideIter.index == index) { break; }
            duration+= slide.access().duration();
        }
        slideBegin = globalTime();
        pentimento.timeController.updateTime(duration);
        pentimento.lectureController.visualsController.updateVisuals();
        
        um.add(function() {
            self.addSlide(newSlide);
        }, ActionTitles.AdditionOfSlide);
    }

    this.addSlide = function(slide) {
        //adding a slide does not start a group! to undo a slide's addition, you must undo all actions leading upto it
        slideBegin = globalTime();
        if(state.currentSlide) { endSlide(slideBegin, state.currentSlide); } //only end the currentSlide if not undefined and not null
        var prevSlide = state.currentSlide;
        var newSlide;
        if(slide) {
            newSlide = slide;
        } else {
            newSlide = new Slide();
        }
        var index = pentimento.lectureController.addSlide(newSlide);
        state.currentSlide = newSlide;
        
        um.add(function() {
            unaddSlide(prevSlide, newSlide, index);
        }, ActionTitles.AdditionOfSlide);
    }

    this.addVisual = function(visual) {
        for(var vert in visual.vertices) {
            visual.vertices[vert].t -= slideBegin;
        }
        visual.tMin -= slideBegin;
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual, insertionIndex);
    }
    
    this.beginRedrawing = function() {
        if(!state.currentSlide) {
            console.log("this should never, ever happen");
            return; 
        }
        um.startHierarchy(ActionGroups.RecordingGroup);
        pentimento.lectureController.visualsController.deleteVisuals(state.selection);
        //somehow get the earliest time!
        var visualsIter = state.currentSlide.access().visuals();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            if(state.selection.indexOf(visual) >= 0 && insertionIndex == null) {
                insertionIndex = visualsIter.index;
            } else if(visual.access().tMin() > state.videoCursor) {
                dirtyVisuals.push(visual);
            }
        }
        
        
        // for(var vis in dirtyVisuals) { //alternatively, set interval for shifting as you go
        //     dirty_times.push(dirtyVisuals[vis].access().tMin());
        //     dirtyVisuals[vis].tMin = NaN; //temporary disabling of the visuals.
        // }
        
        slideBegin = globalTime();
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
    }
    
	this.beginRecording = function() {
        if(!state.currentSlide) {
            console.log("this should never, ever happen");
            return;
        }
        
        var visualsIter = state.currentSlide.access().visuals();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            if(visual.access().tMin() > state.videoCursor) { //is dirty
                if(insertionIndex == null) {insertionIndex = visualsIter.index;}
                dirtyVisuals.push(new MakeDirtyVisual(visual));
            }
        }

        state.recordingType = RecordingTypes.VideoOnly; //will have to change for realz
        
        um.startHierarchy(ActionGroups.RecordingGroup);
        slideBegin = globalTime();
        console.log('beginning recording at', slideBegin);
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
	}

	this.stopRecording = function() {
        var gt = globalTime();
        endSlide(gt);
        pentimento.state.isRecording = false;
        pentimento.timeController.stopRecording(gt);
        um.endHierarchy(ActionGroups.RecordingGroup);
        
        state.recordingType = null;
        slideBegin = NaN;
	}
};