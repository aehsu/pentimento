pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var slideBegin = NaN;
    var dirtyVisuals = [];
    var visualsInsertionTime;
    
    function MakeVisualDirty(visual) {
        this.visual = visual;
        this.tMin = visual.getTMin();
        visual.setTMin(NaN); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER
        this.times = [];
        var vertices = visual.getVertices();
        for(var i in vertices) {
            times.append(vertices[i].getT());
            vertices[i].setT(NaN);
        }
    }
    
    function endSlide(time) {
        //end heirarchy
        console.log('ending slide at', time);
        var diff = time - slideBegin;

        pentimento.lectureController.visualsController.cleanVisuals(dirtyVisuals, diff); //puts at beginning of undo group
        //restores visuals, etc etc.
        pentimento.lectureController.endSlide(diff); //puts at beginning of undo group
        //shifts the slide's duration by diff amount

        dirtyVisuals = [];
        state.visualsInsertionIndex = null;
        slideBegin = NaN;
        um.endHierarchy(ActionGroups.SlideGroup);
    }

    this.addSlide = function(slide) {
        if(!state.currentSlide) { console.log('something happend in adding a slide such that the state is incoherent'); return; }
        slideBegin = globalTime();
        endSlide(slideBegin);

        um.startHierarchy(ActionGroups.SlideGroup);
        pentimento.lectureController.addSlide(); //adds the action onto the undo stack

        updateVisuals();
        state.visualsInsertionIndex = 0;
        visualsInsertionTime = 0;
    }

    this.addVisual = function(visual) {
        //restores a visual into a coherent given the context of the recording before passing it over to the visualsController to actually add it
        var verts = visual.getVertices();
        for(var i in verts) {
            var vert = verts[i];
            vert.setT(visualsInsertionTime + vert.getT() - slideBegin);
        }
        visual.setTMin(visualsInsertionTime + visual.getTMin() - slideBegin);
        
        if(visual.getTDeletion() != null) { visual.setTDeletion(visualsInsertionTime + visual.getTDeletion() - slideBegin); }
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual); //adds an action onto the undo stack
    }
    
    this.beginRedrawing = function() {
        if(!state.currentSlide) {
            console.log("this should never, ever happen");
            return; 
        }

        var iter = state.currentSlide.getVisualsIterator();
        while(iter.hasNext()) {
            var visual = iter.next();
            if(visual.getTMin() > state.videoCursor) { //is dirty
                dirtyVisuals.push(new MakeVisualDirty(visual));
            }
        }
        state.recordingType = RecordingTypes.VideoOnly; //will have to change for realz

        um.startHierarchy(ActionGroups.RecordingGroup);
        pentimento.lectureController.visualsController.deleteVisuals(state.selection);
        //somehow get the earliest time!
        var visualsIter = state.currentSlide.access().visuals();
        var minIndex;
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            if(state.selection.indexOf(visual) >= 0 && state.visualsInsertionIndex == null) {
                state.visualsInsertionIndex = visualsIter.index;
            } else if(visual.access().tMin() > state.videoCursor) {
                dirtyVisuals.push(visual);
            }
        }
        
        slideBegin = globalTime();
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
    }
    
	this.beginRecording = function() {
        if(!state.currentSlide) {
            console.log("this should never, ever happen");
            return;
        }
        
        var iter = state.currentSlide.getVisualsIterator();
        var minIndex;
        while(iter.hasNext()) {
            var visual = iter.next();
            if(visual.getTMin() > state.videoCursor) { //is dirty
                if(minIndex == undefined) { minIndex = iter.index; }
                dirtyVisuals.push(new MakeVisualDirty(visual));
            }
        }
        if(minIndex==undefined) { //no dirty visuals, should instead just append to the end
            state.visualsInsertionIndex = state.currentSlide.getVisuals().length;
        } else {
            state.visualsInsertionIndex = minIndex;
        }
        state.recordingType = RecordingTypes.VideoOnly; //will have to change for realz
        visualsInsertionTime = state.videoCursor;

        slideBegin = globalTime();
        console.log('beginning recording at', slideBegin);
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
        um.startHierarchy(ActionGroups.RecordingGroup);
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