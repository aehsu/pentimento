function VisualsController(lec) {
    var self = this;
    var lecture = lec;
    var state = pentimento.state;
    
    function unaddVisual(slide, visual) {
        var idx = lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return; }
        idx = slide.visuals.indexOf(visual);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return;}
        
        slide.visuals.splice(idx, 1);
        
        um.add(function() {
            self.addVisual(slide, visual, idx);
            self.updateVisuals();
        }, ActionTitles.UnaddVisual);
        
        return visual;
    }
    
    this.addVisual = function(slide, visual, index) {
        var idx = lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in add visual for the visuals controller"); return; }
        
        if(index==undefined || index==null) {
            slide.visuals.push(visual);
        } else {
            slide.visuals.splice(index, 0, visual);
        }
        
        um.add(function() {
            unaddVisual(slide, visual);
            self.updateVisuals();
        }, ActionTitles.AdditionOfVisual);
        
        return visual;
    }
    
    function doShiftVisual(visual, amount) {
        visual.tMin += amount;
        var vertIter = visual.access().vertices();
        while(vertIter.hasNext()) {
            var vert = vertIter.next();
            vert.t += amount;
        }
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
            for(var vis in slide.visuals) {
                var visual = slide.visuals[vis];
                if(visual.tMin >= shift.tMin) { doShiftVisual(visual, shift.duration); }
            }
        }
        
        for(var i in indices) {
            var index = indices[i];
            var visual = visuals[i];
            slide.visuals.splice(index, 0, visual);
        }
        
        visuals.reverse(); //this is not necessary
        //no need to reverse indices here cause it will just get garbagecollected
        //shifts will likewise just get garbagecollected
        
        um.add(function() {
            self.deleteVisuals(slide, visuals);
        }, ActionTitles.DeleteVisual);
        pentimento.lectureController.visualsController.updateVisuals();
    }
    
    this.deleteVisuals = function(slide, visuals) {
        var indices = [];
        var segments = segmentVisuals(visuals);
        var shifts = getSegmentsShifts(segments);
        shifts.reverse();
        
        console.log("pre-DELETION visuals"); console.log(state.currentSlide.visuals);
        console.log("DELETION shifts"); console.log(shifts);
        
        for(var vis in visuals) { //remove the visuals from the slide
            var index = state.currentSlide.visuals.indexOf(visuals[vis]);
            state.currentSlide.visuals.splice(index, 1);
            indices.push(index);
            if(index==-1) { console.log('error in deletion, a visual could not be found on the slide given'); }
        }
        
        console.log("post-DELETION visuals"); console.log(state.currentSlide.visuals);
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            for(var vis in state.currentSlide.visuals) {
                var visual = state.currentSlide.visuals[vis];
                if(visual.tMin >= shift.tMin ) { doShiftVisual(visual, -1.0*shift.duration); } //visual.tMin-1.0*shift.duration
            }
        }
        shifts.reverse();
        
        //should we change the duration of the slide?!?
        um.add(function() {
            undeleteVisuals(state.currentSlide, visuals, indices, shifts);
        }, ActionTitles.DeleteVisual);
        pentimento.lectureController.visualsController.updateVisuals();
    }

    this.updateVisuals = function() {
        //renderer code. temporary stint until renderer code gets well integrated
        clear();
        var slideIter = pentimento.lectureController.getLectureAccessor().slides();
        var slideTime = state.videoCursor;
        var visuals = [];
        while(slideIter.hasNext()) {
            var slide = slideIter.next();
            if(slide==state.currentSlide) { //if(running_time + slide_accessor.duration() < pentimento.state.current_time) //
                var visualsIter = slide.access().visuals();
                while(visualsIter.hasNext()) {
                    var visualAccess = visualsIter.next().access();
                    if(slideTime > visualAccess.tMin()) { drawVisual(visualAccess); }
                }
            } else {
                slideTime -= slide.duration;
            }
        }
    }
    /************* HELPER FUNCTIONS *************/
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
};