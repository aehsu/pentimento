pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var shiftInterval = null;
    var dirtyVisuals = [];
    var dirtyConstraints = [];
    var lastTimeUpdate;
    var visualsInsertionTime;
    
    function endSlide() {
        console.log('ending slide');

        dirtyVisuals = [];
        state.visualsInsertionIndex = null;
    }

    this.addSlide = function(slide) {
        if(!state.currentSlide) { console.log('something happend in adding a slide such that the state is incoherent'); return; }
        endSlide();

        var prevSlide = state.currentSlide;
        var newSlide = new Slide();
        pentimento.lectureController.addSlide(prevSlide, newSlide); //DOES NOT add an action onto the undo stack
        state.currentSlide = newSlide;
        // um.startHierarchy(ActionGroups.SlideGroup);
        updateVisuals();
        visualsInsertionTime = 0;
        state.visualsInsertionIndex = 0;
    }

    this.addVisual = function(visual) {
        //puts a visual into a coherent state given the context of the recording before passing it 
        //over to the visualsController to actually add it
        var verts = visual.getVertices();
        for(var i in verts) {
            var vert = verts[i];
            vert.setT(visualsInsertionTime + vert.getT() - slideBegin);
        }
        visual.setTMin(visualsInsertionTime + visual.getTMin() - slideBegin);
        
        if(visual.getTDeletion() != null) { visual.setTDeletion(visualsInsertionTime + visual.getTDeletion() - slideBegin); }
        um.startHierarchy(ActionGroups.VisualGroup);
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual); //adds an action onto the undo stack
        um.endHierarchy(ActionGroups.VisualGroup);
    }

    this.appendVertex = function(visual, vertex) {
        vertex.setT(visualsInsertionTime + vertex.getT() - slideBegin);
        pentimento.lectureController.visualsController.appendVertex(visual, vertex);
    }

    function setDirtyConstraints() {

    }
    
    function setDirtyVisuals() {
        var iter = state.currentSlide.getVisualsIterator();
        while(iter.hasNext()) {
            var visual = iter.next();
            if(visual.getTMin() > state.videoCursor) { //is dirty
                dirtyVisuals.push(visual);
            }
        }
    }

	this.beginRecording = function() {
        if(!state.currentSlide) {
            console.log("this should never, ever happen");
            return;
        }

        state.recordingType = RecordingTypes.VideoOnly; //will have to change for realz when audio comes into play
        var duration = 0;
        var iter = pentimento.lecture.getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            if(slide==state.currentSlide) { break; }

            duration += slide.getDuration();
        }
        
        //TODO snap state.videoCursor leftmost
        //visualsInsertionTime is the time WITHIN the current slide at which you begin a recording
        visualsInsertionTime = state.videoCursor - duration;
        slideBegin = globalTime();
        
        setDirtyConstraints();
        //setDirtySlide(); -- always state.currentSlide
        setDirtyVisuals();
        
        // shiftInterval = setInterval(function() {
        //     var diff = globalTime() - lastTimeUpdate;
        //     um.startHierarchy(ActionGroups.ShiftGroup);
        //     pentimento.lectureController.retimingController.shiftConstraints(dirtyConstraints, diff);
        //     pentimento.lectureController.shiftSlideDuration(state.currentSlide, diff);
        //     pentimento.lectureController.visualsController.shiftVisuals(dirtyVisuals, diff);
        //     um.endHierarchy(ActionGroups.ShiftGroup);
        //     lastTimeUpdate += diff;
        // }, SHIFT_INTERVAL);
        console.log('beginning recording at', slideBegin);

        um.startHierarchy(ActionGroups.RecordingGroup);
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
	}

	this.stopRecording = function() {
        var gt = globalTime();
        endSlide(gt);
        pentimento.state.isRecording = false;
        pentimento.timeController.stopRecording(gt);
        try {
            um.endHierarchy(ActionGroups.RecordingGroup);
        } catch(e) {
            console.log(e, 'the group was not ended properly due do an undo in the middle');
        }

        
        state.recordingType = null;
        slideBegin = NaN;
        originSlide = null;
	}
};