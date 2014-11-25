pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var self = this;
    var state = pentimento.state;
    var originSlide = null;
    var originSlideDuration = null;
    var shiftInterval = null;
    var dirtyVisuals = [];
    var dirtyConstraints = [];
    var recordingBegin = NaN;
    var lastTimeUpdate = NaN;
    var visualsInsertionTime = NaN;

    function unAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals) {
        um.startHierarchy(ActionGroups.SubSlideGroup); //should end the previous sub-slide-group
        var time = globalTime();
        var diff = time - lastTimeUpdate;
        lastTimeUpdate = time;

        newSlide.setDuration(newSlide.getDuration() + diff);
        visualsInsertionTime = oldInsertionTime + prevSlide.getDuration();
        prevSlide.setDuration(prevSlide.getDuration() + newSlide.getDuration());
        pentimento.lectureController.removeSlide(newSlide); //does not add onto the undo stack
        // um.add(function() {}, ActionTitles.Dummy);
        state.currentSlide = prevSlide;

        um.add(function() {
            reAddSlide(prevSlide, newSlide, oldInsertionTime, dirtyVisuals);
        }, ActionTitles.AdditionOfSlide);
    }

    function reAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals) {
        //this will break due to um's semantics if you're in the middle of a recording right now
        um.startHierarchy(ActionGroups.SubSlideGroup);
        var time = globalTime();
        var diff = time - lastTimeUpdate;
        lastTimeUpdate = time;

        prevSlide.setDuration(prevSlide.getDuration() - newSlide.getDuration());
        newSlide.setDuration(newSlide.getDuration() + diff);
        pentimento.lectureController.addSlide(prevSlide, newSlide);
        // um.add(function() {}, ActionTitles.Dummy);
        state.currentSlide = newSlide;
        visualsInsertionTime = 0;

        um.add(function() {
            unAddSlide(prevSlide, newSlide, oldInsertionTime, oldDirtyVisuals);
        }, ActionTitles.AdditionOfSlide);
    }

    this.addSlide = function() {
        if(!state.currentSlide) { console.log('something happend in adding a slide such that the state is incoherent'); return; }
        um.startHierarchy(ActionGroups.SubSlideGroup);
        var time = globalTime();
        var diff = time - lastTimeUpdate;
        lastTimeUpdate = time;
        var oldInsertionTime = visualsInsertionTime;
        var oldDirtyVisuals = dirtyVisuals;
        var prevSlide = state.currentSlide;
        var newSlide = new Slide();
        
        pentimento.lectureController.addSlide(prevSlide, newSlide); //DOES NOT add an action onto the undo stack
        prevSlide.setDuration(prevSlide.getDuration() + diff);

        // um.add(function() {}, ActionTitles.Dummy);
        state.currentSlide = newSlide;
        updateVisuals(false);
        drawThumbnails();
        visualsInsertionTime = 0;

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
            vert.setT(visualsInsertionTime + vert.getT() - lastTimeUpdate);
        }
        visual.setTMin(visualsInsertionTime + visual.getTMin() - lastTimeUpdate);
        
        if(visual.getTDeletion() != null) { visual.setTDeletion(visualsInsertionTime + visual.getTDeletion() - lastTimeUpdate); }
        um.startHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
        //adds an action onto the undo stack
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual);
        um.endHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
    }

    this.appendVertex = function(visual, vertex) {
        vertex.setT(visualsInsertionTime + vertex.getT() - lastTimeUpdate);
        pentimento.lectureController.visualsController.appendVertex(visual, vertex);
    }

    this.addProperty = function(visual, property) {
        property.setTime(visualsInsertionTime + property.getTime() - lastTimeUpdate);
        um.startHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
        pentimento.lectureController.visualsController.addProperty(visual, property);
        um.endHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
    }

    this.setTDeletion = function(visuals, time) {
        um.startHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
        for(var i in visuals) {
            var visual = visuals[i];
            pentimento.lectureController.visualsController.setTDeletion(visual, visualsInsertionTime + time - lastTimeUpdate);
        }
        um.endHierarchy(ActionGroups.VisualGroup);// NOT SUPPORTED BY UNDO MANAGER
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
        //FIX ONCE AUDIO INTEGRATED! RIGHT NOW USES state.videoCursor for both times
        um.startHierarchy(ActionGroups.EditGroup);
        pentimento.lectureController.retimingController.addConstraint(new Constraint(state.videoCursor, state.videoCursor, ConstraintTypes.Automatic));
        pentimento.lectureController.retimingController.addConstraint(new Constraint(state.videoCursor+1, state.videoCursor+1, ConstraintTypes.Automatic));
        um.endHierarchy(ActionGroups.EditGroup);

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
        lastTimeUpdate = globalTime();
        recordingBegin = lastTimeUpdate;
        originSlide = state.currentSlide;
        originSlideDuration = state.currentSlide.getDuration();

        setDirtyConstraints();
        //setDirtySlide(); -- always state.currentSlide
        setDirtyVisuals();

        // console.log('beginning recording at', lastTimeUpdate);
        um.startHierarchy(ActionGroups.RecordingGroup);
        um.add(function() {}, ActionTitles.Dummy);
        um.startHierarchy(ActionGroups.SubSlideGroup);
        um.add(function() {}, ActionTitles.Dummy);
        pentimento.timeController.beginRecording(lastTimeUpdate);
        pentimento.state.isRecording = true;
    };

    function redoRecording(dummyOriginSlide, offset, tmpConst, tmpVisuals, totalDiff, diff) {
        dummyOriginSlide.setDuration(dummyOriginSlide.getDuration()+offset)
        pentimento.lectureController.retimingController.shiftConstraints(tmpConst, 1.0*totalDiff);
        pentimento.lectureController.visualsController.shiftVisuals(tmpVisuals, 1.0*diff);

        pentimento.timeController.updateVideoTime(0);
        um.add(function() {
            undoRecording(dummyOriginSlide, offset, tmpConst, tmpVisuals, totalDiff, diff);
        }, ActionTitles.Recording);
    }

    function undoRecording(dummyOriginSlide, offset, tmpConst, tmpVisuals, totalDiff, diff) {
        dummyOriginSlide.setDuration(dummyOriginSlide.getDuration()-offset);
        pentimento.lectureController.retimingController.shiftConstraints(tmpConst, -1.0*totalDiff);
        pentimento.lectureController.visualsController.shiftVisuals(tmpVisuals, -1.0*diff);

        pentimento.timeController.updateVideoTime(0);
        um.add(function() {
            redoRecording(dummyOriginSlide, offset, tmpConst, tmpVisuals, totalDiff, diff)
        }, ActionTitles.Recording);
    }

	this.stopRecording = function() {
        var gt = globalTime();
        var diff = gt - lastTimeUpdate;
        state.currentSlide.setDuration(state.currentSlide.getDuration() + diff);
        var totalDiff = gt - recordingBegin;

        //DOES NOT add an action onto the undo stack
        pentimento.lectureController.visualsController.cleanVisuals(dirtyVisuals, originSlide.getDuration() - originSlideDuration);
        pentimento.lectureController.retimingController.cleanConstraints(dirtyConstraints, totalDiff);

        var dummyOriginSlide = originSlide;
        var dummyOriginSlideDuration = originSlideDuration;
        var tmpVisuals = []; for(var i in dirtyVisuals) { tmpVisuals.push(dirtyVisuals[i].visual); }
        var tmpConst = []; for(var i in dirtyConstraints) { tmpConst.push(dirtyConstraints[i]); }
        um.addToStartOfGroup(ActionGroups.RecordingGroup, function() {
            var offset = dummyOriginSlide.getDuration() - dummyOriginSlideDuration
            dummyOriginSlide.setDuration(dummyOriginSlideDuration);

            pentimento.lectureController.retimingController.shiftConstraints(tmpConst, -1.0*totalDiff);
            pentimento.lectureController.visualsController.shiftVisuals(tmpVisuals, -1.0*diff);

            //might not really do what you want with...pentimento.state.videoCursor - offset
            pentimento.timeController.updateVideoTime(0);

            um.add(function() {
                redoRecording(dummyOriginSlide, offset, tmpConst, tmpVisuals, totalDiff, diff);
            }, ActionTitles.Recording);
        });
        pentimento.state.isRecording = false;
        pentimento.timeController.stopRecording(gt);
        try {
            um.endHierarchy(ActionGroups.RecordingGroup);
        } catch(e) {
            console.log(e, 'the group was not ended properly due do an redo in the middle');
        }
        
        recordingBegin = NaN;
        lastTimeUpdate = NaN;
        visualsInsertionTime = NaN
        originSlide = null;
        originSlideDuration = null;
        dirtyVisuals = [];
        dirtyConstraints = [];

        window.retimer_window.drawThumbnails(1000, 1);
        // window.retimer_window.extendRetimingConstraintsCanvas();
	}
};