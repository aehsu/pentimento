pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var self = this;
    var state = pentimento.state;
    var originSlide = null;
    var originSlideDuration = null;
    var shiftInterval = null;
    var dirtyVisuals = [];
    var dirtyConstraints = [];
    var recordingBegin;
    var slideBegin;
    var lastTimeUpdate;
    var visualsInsertionTime;

    function unAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals) {
        state.currentSlide = prevSlide;
        pentimento.lectureController.removeSlide(newSlide);
        var time = globalTime();
        var diff = time - slideBegin;
        slideBegin = time;
        newSlide.setDuration(newSlide.getDuration() + diff);
        prevSlide.setDuration(prevSlide.getDuration() + newSlide.getDuration());
        visualsInsertionTime = oldInsertionTime;
        dirtyVisuals = [];
        for(var i in oldDirtyVisuals) {
            var visual = oldDirtyVisuals[i].visual;
            dirtyVisuals.push(pentimento.lectureController.visualsController.makeVisualDirty(visual));
        }

        um.add(function() {
            reAddSlide(prevSlide, newSlide, oldInsertionTime, dirtyVisuals);
        }, ActionTitles.AdditionOfSlide);
    }

    function reAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals) {
        //this will break due to um's semantics
        um.add(function() {
            unAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals);
        }, ActionTitles.AdditionOfSlide);
    }

    this.addSlide = function() {
        if(!state.currentSlide) { console.log('something happend in adding a slide such that the state is incoherent'); return; }

        var time = globalTime();
        var diff = time - slideBegin;
        slideBegin = time;
        var oldInsertionTime = visualsInsertionTime;
        var oldDirtyVisuals = dirtyVisuals;
        var prevSlide = state.currentSlide;
        var newSlide = new Slide();
        pentimento.lectureController.addSlide(prevSlide, newSlide); //DOES NOT add an action onto the undo stack
        pentimento.lectureController.visualsController.cleanVisuals(dirtyVisuals, diff); //DOES NOT add an action onto the undo stack
        //need to add an action onto the start of the group...but then if re-adding the slide
        //the undo manager will break...
        var tmp = []; for(var i in dirtyVisuals) { tmp.push(dirtyVisuals[i].visual); }
        um.addToStartOfGroup(ActionGroups.RecordingGroup, function() {
            pentimento.lectureController.visualsController.shiftVisuals(tmp, -1.0*diff);
        });
        prevSlide.setDuration(prevSlide.getDuration() + diff);
        state.currentSlide = newSlide;
        updateVisuals();
        visualsInsertionTime = 0;
        dirtyVisuals = [];

        um.add(function() {
            unAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals);
        }, ActionTitles.AdditionOfSlide);
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
        // um.startHierarchy(ActionGroups.VisualGroup);
        //adds an action onto the undo stack
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual);
        // um.endHierarchy(ActionGroups.VisualGroup);
    }

    this.appendVertex = function(visual, vertex) {
        vertex.setT(visualsInsertionTime + vertex.getT() - slideBegin);
        pentimento.lectureController.visualsController.appendVertex(visual, vertex);
    }

    function setDirtyConstraints() {
        var iter = pentimento.lecture.getConstraintsIterator();
        while(iter.hasNext()) {
            var constraint = iter.next();
            if(constraint.getTVisual() > state.videoCursor) {
                dirtyConstraints.push(pentimento.lectureController.retimingController.makeConstraintDirty(constraint));
            }
        }
    }
    
    function setDirtyVisuals() {
        var iter = state.currentSlide.getVisualsIterator();
        while(iter.hasNext()) {
            var visual = iter.next();
            if(visual.getTMin() > state.videoCursor) { //is dirty
                dirtyVisuals.push(pentimento.lectureController.visualsController.makeVisualDirty(visual));
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
        recordingBegin = slideBegin;
        // ORIGIN SLIDE;;;;;;
        setDirtyConstraints();
        //setDirtySlide(); -- always state.currentSlide
        setDirtyVisuals();
        console.log('beginning recording at', slideBegin);

        um.startHierarchy(ActionGroups.RecordingGroup);
        pentimento.timeController.beginRecording(slideBegin);
        pentimento.state.isRecording = true;
	}

	this.stopRecording = function() {
        var gt = globalTime();
        var diff = gt - slideBegin;
        state.currentSlide.setDuration(state.currentSlide.getDuration() + diff);
        pentimento.lectureController.visualsController.cleanVisuals(dirtyVisuals, diff); //DOES NOT add an action onto the undo stack
        var tmp = []; for(var i in dirtyVisuals) { tmp.push(dirtyVisuals[i].visual); }
        //UNTIME THAT STUFF!!!
        um.addToStartOfGroup(ActionGroups.RecordingGroup, function() {
            pentimento.lectureController.visualsController.shiftVisuals(tmp, -1.0*diff);
        });
        // f(;;;;//shift constraints. ORIGIN SLIDE
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