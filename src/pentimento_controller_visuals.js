//Because of integration with the undo manager, the undo actions should call updateVisuals()
//appropriately. Only the undo actions, though, not the forward actions! Therefore, any time
//um.add is called, it should have an updateVisuals inside of the function if necessary

function VisualsController(lec) {
    var self = this;
    var lecture = lec;
    var state = pentimento.state;

    this.MakeVisualDirty = function(visual) {
        var wrapper = {};
        wrapper.visual = visual;
        wrapper.tMin = visual.getTMin();
        visual.setTMin(NaN); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER
        wrapper.times = [];
        var vertices = visual.getVertices();
        for(var i in vertices) {
            wrapper.times.push(vertices[i].getT());
            vertices[i].setT(NaN);
        }
        return wrapper;
    }

    /*********************************CLEANING OF VISUALS*********************************/
    this.cleanVisuals = function(dirtyWrappers, shift) {
        if(dirtyWrappers.lenght==0) { return; } //DONT add anything to the beginning of the group if we don't need to
        for(var i in dirtyWrappers) {
            var dirtyObj = dirtyWrappers[i];
            var visual = dirtyObj.visual;
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(dirtyObj.times[j]+shift);
            }
            visual.setTMin(dirtyObj.tMin + shift);
        }

        um.addToStartOfGroup(ActionGroups.SlideGroup, function() {
            reDirtyVisuals(dirtyVisuals, shift);
        });
    }

    function reDirtyVisuals(dirtyVisuals, shift) {
        for(var i in dirtyVisuals.length) {
            var dirtyObj = dirtyVisuals[i];
            var visual = dirtyObj.visual;
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(NaN);
            }
            visual.setTMin(NaN);
        }

        um.add(function() {
            reCleanVisuals(dirtyVisuals, shift);
        }, ActionTitles.ShiftVisuals);
    }

    function reCleanVisuals(dirtyVisuals, shift) {
        for(var i in dirtyVisuals.length) {
            var dirtyObj = dirtyVisuals[i];
            var visual = dirtyObj.visual;
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(dirtyObj.times[j]+shift);
            }
            visual.setTMin(dirtyObj.tMin + shift);
        }

        um.add(function() {
            reDirtyVisuals(dirtyVisuals, shift);
        }, ActionTitles.ShiftVisuals);
    }
    /*********************************CLEANING OF VISUALS*********************************/
    /**********************************ADDING OF VISUALS**********************************/
    function unaddVisual(slide, visual) {
        var idx = lecture.getSlides().indexOf(slide);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return; }
        idx = slide.getVisuals().indexOf(visual);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return;}
        
        slide.getVisuals().splice(idx, 1);
        state.visualsInsertionIndex--;
        um.add(function() {
            self.addVisual(slide, visual);
            updateVisuals();
        }, ActionTitles.AdditionOfVisual);
        return visual;
    }
    
    this.addVisual = function(slide, visual) {
        var idx = lecture.getSlides().indexOf(slide);
        if(idx==-1) { console.log("Error in add visual for the visuals controller"); return; }
        
        slide.getVisuals().splice(state.visualsInsertionIndex, 0, visual);
        state.visualsInsertionIndex++;
        um.add(function() {
            unaddVisual(slide, visual);
            updateVisuals();
        }, ActionTitles.AdditionOfVisual);
        return visual;
    }

    this.appendVertex = function(visual, vertex) {
        visual.getVertices().push(vertex);
    }
    /**********************************ADDING OF VISUALS**********************************/
    /*******************************TRANSFORMING OF VISUALS********************************/
    //Typically during a recording, these are the handlers for transforms to be applied to visuals
    //Resizing or such actions are transformations which may happen during editing


    /*******************************TRANSFORMING OF VISUALS********************************/
    /**********************************EDITING OF VISUALS**********************************/
    //This section is primarily concerned with the direct editing of the properties of
    //a visual. Recording edits to a visual are transforms, which is in a later section
    this.editWidth = function(visuals, newWidth) {
        var widths = [];
        for(var i in visuals) {
            var visual = visuals[i];
            widths.push(visual.getProperties().getWidth());
            visual.getProperties().setWidth(newWidth);
        }

        um.add(function() {
            unEditWidths(visuals, widths, newWidth);
            updateVisuals();
        }, ActionTitles.EditOfVisual)
    }

    function unEditWidths(visuals, widths, newWidth) {
        for(var i in visuals) {
            var visual = visuals[i];
            visual.getProperties().setWidth(widths[i]);
        }

        um.add(function() {
            self.editWidth(visuals, newWidth);
            updateVisuals();
        }, ActionTitles.EditOfVisual);
    }

    this.editColor = function(visuals, newColor) {
        //TODO FILL
    }

    function unEditColors(visuals, colors) {
        //TODO FILL
    }

    function doShiftVisual(visual, amount) {
        visual.setTMin(visual.getTMin() + amount);
        var vertIter = visual.getVerticesIterator();
        while(vertIter.hasNext()) {
            var vert = vertIter.next();
            vert.setT(vert.getT() + amount);
        }
        if(visual.getTDeletion()!=null) { visual.setTDeletion(visual.getTDeletion() + amount);}
    }
    
    this.shiftVisuals = function(visuals, amount) {
        for(var vis in visuals) { doShiftVisual(visuals[vis], amount); }
        
        //black magic, move to beginning?
        var shift = um.addToStartOfGroup(ActionGroups.RecordingGroup, function() {
            for(var vis in visuals) { doShiftVisual(visuals[vis], -1.0*amount); }
        });
        
        if(DEBUG) { console.log(shift); }
    }
    
    function undeleteVisuals(slide, visuals, indices, shifts) {
        //need to handle shifting correctly
        shifts.reverse();
        visuals.reverse();
        indices.reverse(); //necessary to preserve correct ordering
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            var visualIter = slide.getVisualsIterator();
            while(visualIter.hasNext()) {
                var visual = visualIter.next();
                if(visual.getTMin() >= shift.tMin) { doShiftVisual(visual, shift.duration); }
            }
        }
        
        for(var i in indices) {
            var index = indices[i];
            var visual = visuals[i];
            slide.getVisuals().splice(index, 0, visual);
        }
        
        // visuals.reverse(); //this is not necessary
        //no need to reverse indices here cause it will just get garbagecollected
        //shifts will likewise just get garbagecollected

        //TODO shift video cursor
        um.add(function() {
            self.deleteVisuals(slide, visuals);
            updateVisuals();
        }, ActionTitles.DeleteVisual);
    }
    
    this.deleteVisuals = function(slide, visuals) {
        var indices = [];
        var segments = segmentVisuals(visuals);
        var shifts = getSegmentsShifts(segments);
        shifts.reverse();
        
        console.log("pre-DELETION visuals"); console.log(state.currentSlide.visuals);
        console.log("DELETION shifts"); console.log(shifts);
        
        for(var vis in visuals) { //remove the visuals from the slide
            var index = state.currentSlide.getVisuals().indexOf(visuals[vis]);
            state.currentSlide.getVisuals().splice(index, 1);
            indices.push(index);
            if(index==-1) { console.log('error in deletion, a visual could not be found on the slide given'); }
        }
        
        console.log("post-DELETION visuals"); console.log(state.currentSlide.getVisuals());
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            var visualIter = state.currentSlide.getVisualsIterator();
            while(visualIter.hasNext()) {
                var visual = visualIter.next();
                if(visual.getTMin() >= shift.tMin ) { doShiftVisual(visual, -1.0*shift.duration); } //visual.tMin-1.0*shift.duration
            }
        }
        shifts.reverse();
        //move video cursor

        //should we change the duration of the slide?!?
        um.add(function() {
            undeleteVisuals(slide, visuals, indices, shifts);
            updateVisuals();
        }, ActionTitles.DeleteVisual);
    }
    /**********************************EDITING OF VISUALS**********************************/
    /**********************************HELPER FUNCTIONS***********************************/
    function prevNeighbor(visual) {
        var prev;
        for(vis in state.currentSlide.visuals) {
            var tMin = state.currentSlide.visuals[vis].tMin;
            if(tMin < visual.tMin && (prev==undefined || tMin > prev.tMin)) {
                prev = state.currentSlide.visuals[vis];
            }
        }
        return prev;
    }

    function nextNeighbor(visual) {
        var next;
        for(vis in state.currentSlide.visuals) {
            var tMin = state.currentSlide.visuals[vis].tMin;
            if(tMin > visual.tMin && (next==undefined || tMin < next.tMin)) {
                next = state.currentSlide.visuals[vis];
            }
        }
        return next;
    }
    
    function segmentVisuals(visuals) {
        //returns an array of segments, where each segment consists of a set of contiguous visuals
        function cmpVisuals(a, b) {
            if(a.tMin < b.tMin) {
                return -1;
            }
            if (b.tMin > a.tMin) {
                return 1;
            }
            return 0;
        }
        function cmpSegments(a, b) {
            //only to be used if each segment is sorted!
            if (a[0].tMin < b[0].tMin) {
                return -1;
            }
            if (b[0].tMin > a[0].tMin) {
                return 1;
            }
            return 0;
        }
        var visualsCopy = visuals.slice();
        var segments = [];
        var segment = [];
        var endpoints; //just pointers
        while(visualsCopy.length>0) {
            endpoints = [visualsCopy[0]];
            while(endpoints.length>0) {
                var visual = endpoints.shift();
                segment.push(visual);
                visualsCopy.splice(visualsCopy.indexOf(visual), 1);
                var prevVis = prevNeighbor(visual);
                var nextVis = nextNeighbor(visual);
                if(visualsCopy.indexOf(prevVis) > -1) {
                    endpoints.push(prevVis);
                }
                if(visualsCopy.indexOf(nextVis) > -1) {
                    endpoints.push(nextVis);
                }
            }
            segment.sort(cmpVisuals);
            segments.push(segment);
            segment = [];
        }
        segments.sort(cmpSegments);
        return segments;
    }

    function getSegmentsShifts(segments) {
        var shifts = [];
        for(seg in segments) {
            var duration = 0;
            var segment = segments[seg];
            var first = segment[0];
            var last = segment[segment.length-1];
            var next = nextNeighbor(last);
            if (next != undefined) {
                duration += next.tMin-first.tMin;
            } else {
                duration += last.vertices[last.vertices.length-1]['t'] - first.tMin;
            }
            shifts.push({'tMin':first.tMin, 'duration':duration});
        }
        return shifts;
    }
    /**********************************HELPER FUNCTIONS***********************************/
};