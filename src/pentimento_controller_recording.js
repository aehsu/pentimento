pentimento.recordingController = new function() {//records little mini-lectures, which is all a lecture is.
    var state = pentimento.state;
    var slideBegin = NaN;
    var dirtyVisuals = [];
    var visualsInsertionTime;
    
    function endSlide(time) {
        console.log('ending slide at', time);
        var diff = time - slideBegin;

        pentimento.lectureController.visualsController.cleanVisuals(dirtyVisuals, diff);
        //puts at beginning of undo group
        //restores visuals, etc etc.
        pentimento.lectureController.endSlide(diff); //puts at beginning of undo group
        //shifts the slide's duration by diff amount

        um.endHierarchy(ActionGroups.SlideGroup);
        slideBegin = NaN;
        dirtyVisuals = [];
        state.visualsInsertionIndex = null;
    }

    this.addSlide = function(slide) {
        if(!state.currentSlide) { console.log('something happend in adding a slide such that the state is incoherent'); return; }
        var time = globalTime();
        endSlide(time);

        um.startHierarchy(ActionGroups.SlideGroup);
        pentimento.lectureController.addSlide(); //adds the action onto the undo stack

        updateVisuals();
        slideBegin = time;
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
        pentimento.lectureController.visualsController.addVisual(state.currentSlide, visual); //adds an action onto the undo stack
    }

    this.appendVertex = function(visual, vertex) {
        vertex.setT(visualsInsertionTime + vertex.getT() - slideBegin);
        pentimento.lectureController.visualsController.appendVertex(visual, vertex);
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
                dirtyVisuals.push(pentimento.lectureController.visualsController.MakeVisualDirty(visual));
            }
        }
        if(minIndex==undefined) { //no dirty visuals, should instead just append to the end
            state.visualsInsertionIndex = state.currentSlide.getVisuals().length;
        } else {
            //Fredo and I disagree on this point, and he thinks things should just be put at the end
            //I believe this gives odd semantics, but this if-else could just be deleted and replaced with the
            //if-body. Fredo's semantics would be provided instead of mine, in that case
            state.visualsInsertionIndex = minIndex;
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
        console.log('beginning recording at', slideBegin);

        um.startHierarchy(ActionGroups.RecordingGroup);
        um.startHierarchy(ActionGroups.SlideGroup);
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