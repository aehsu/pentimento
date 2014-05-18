//Because of integration with the undo manager, the undo actions should call updateVisuals()
//appropriately. Only the undo actions, though, not the forward actions! Therefore, any time
//um.add is called, it should have an updateVisuals inside of the function if necessary

function VisualsController(lec) {
    var self = this;
    var lecture = lec;
    var state = pentimento.state;

    this.makeVisualDirty = function(visual) {
        var wrapper = {};
        wrapper.visual = visual;
        wrapper.tMin = visual.getTMin();
        visual.setTMin(Number.POSITIVE_INFINITY); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER
        wrapper.times = [];
        var vertices = visual.getVertices();
        for(var i in vertices) {
            wrapper.times.push(vertices[i].getT());
            vertices[i].setT(Number.POSITIVE_INFINITY);
        }
        //would have to disable transforms
        return wrapper;
    }

    this.cleanVisuals = function(dirtyWrappers, amount) {
        for(var i in dirtyWrappers) {
            var dirtyWrapper = dirtyWrappers[i];
            var visual = dirtyWrapper.visual;
            visual.setTMin(dirtyWrapper.tMin + amount);
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(dirtyWrapper.times[j] + amount);
            }
            //would have to re-enable transforms
        }
    }

    this.muckVisuals = function(dirtyWrappers) {
        for(var i in dirtyWrappers) {
            var dirtyWrapper = dirtyWrappers[i];
            var visual = dirtyWrapper.visual;
            visual.setTMin(Number.POSITIVE_INFINITY);
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(Number.POSITIVE_INFINITY);
            }
            //would have to disable transforms
        }
    }

    /**********************************ADDING OF VISUALS**********************************/
    function unaddVisual(slide, visual) {
        var idx = lecture.getSlides().indexOf(slide);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return; }
        idx = slide.getVisuals().indexOf(visual);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return;}
        
        slide.getVisuals().splice(idx, 1);
        um.add(function() {
            self.addVisual(slide, visual);
        }, ActionTitles.AdditionOfVisual);
        return visual;
    }
    
    this.addVisual = function(slide, visual) {
        var idx = lecture.getSlides().indexOf(slide);
        if(idx==-1) { console.log("Error in add visual for the visuals controller"); return; }
        
        // slide.getVisuals().splice(state.visualsInsertionIndex, 0, visual);
        slide.getVisuals().push(visual);
        um.add(function() {
            unaddVisual(slide, visual);
        }, ActionTitles.AdditionOfVisual);
        return visual;
    }

    this.appendVertex = function(visual, vertex) {
        visual.getVertices().push(vertex);
    }

    function unaddProperty(visual, property) {
        var idx = visual.getProperyTransforms().indexOf(property);
        visual.getPropertyTransforms().splice(idx, 1);

        um.add(function() {
            self.addProperty(visual, property);
        }, ActionTitles.AdditionOfPropery);
    }

    this.addProperty = function(visual, property) {
        visual.getPropertyTransforms().push(property);

        um.add(function() {
            unaddProperty(visual, property);
        }, ActionTitles.AdditionOfPropery);
    }

    this.setTDeletion = function(visual, time) {
        var tdel = visual.getTDeletion()
        visual.setTDeletion(time);

        um.add(function() {
            self.setTDeletion(visual, tdel);
        }, ActionTitles.DeleteVisual)
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
        var widthObjs = [];
        for(var i in visuals) {
            var visual = visuals[i];
            var widthObj = {};
            widthObj.widthTrans = [];
            widthObj.indices = [];
            widthObj.width  = visual.getProperties().getWidth();
            visual.getProperties().setWidth(newWidth);
            var propTrans = visual.getPropertyTransforms();
            for(var j in propTrans) {
                if(propTrans[j].type=="width") {
                    widthObj.widthTrans.push(propTrans[j]);
                    widthObj.indices.push(j);
                }
            }
            for(var j in widthObj.widthTrans) {
                propTrans.splice(propTrans.indexOf(widthObj.widthTrans[j]), 1);
            }
            widthObjs.push(widthObj);
        }

        um.add(function() {
            unEditWidths(visuals, widthObjs, newWidth);
        }, ActionTitles.Edit)
    }

    function unEditWidths(visuals, widthObjs, newWidth) {
        for(var i in visuals) {
            var visual = visuals[i];
            var widthObj = widthObjs[i];
            visual.getProperties().setWidth(widthObjs[i].width);
            widthObj.indices.reverse();
            widthObj.widthTrans.reverse();
            var propTrans = visual.getPropertyTransforms();
            for(var j in widthObj.indices) {
                propTrans.splice(widthObj.indices[j], 0, widthObj.widthTrans[j]);
            }
        }

        um.add(function() {
            self.editWidth(visuals, newWidth);
        }, ActionTitles.Edit);
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
        var propTransIter = visual.getPropertyTransformsIterator();
        while(propTransIter.hasNext()) {
            var propTrans = propTransIter.next();
            propTrans.setT(propTrans.getT() + amount);
        }
        var spatTransIter = visual.getSpatialTransformsIterator();
        while(spatTransIter.hasNext()) {
            var spatTrans = spatTransIter.next();
            spatTrans.setT(spatTrans.getT() + amount);
        }
    }
    
    this.shiftVisuals = function(visuals, amount) {
        if(visuals.length==0) { return; }
        for(var vis in visuals) { doShiftVisual(visuals[vis], amount); }
        
        var shift = um.add(function() {
            for(var vis in visuals) { doShiftVisual(visuals[vis], -1.0*amount); }
        }, ActionTitles.ShiftVisuals);
        
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

        um.add(function() {
            self.deleteVisuals(slide, visuals);
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
        //should we change the duration of the slide?!?
        um.add(function() {
            undeleteVisuals(slide, visuals, indices, shifts);
        }, ActionTitles.DeleteVisual);
        return shifts[0].tMin;
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