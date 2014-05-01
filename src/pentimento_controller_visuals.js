function VisualsController(lecture) {
    var self = this;
    var _lecture = lecture;
    var state = pentimento.state;
    
    function unaddVisual(slide, visual) {
        var idx = _lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return; }
        idx = slide.visuals.indexOf(visual);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return;}
        
        slide.visuals.splice(idx, 1);
        
        um.add(function() {
            self.addVisual(slide, visual, idx);
            self.updateVisuals();
        }, ActionGroups.Visual_Group);
        
        return visual;
    }
    
    this.addVisual = function(slide, visual, index) {
        var idx = _lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in add visual for the visuals controller"); return; }
        
        if(index==undefined || index==null) {
            slide.visuals.push(visual);
        } else {
            slide.visuals.splice(index, 0, visual);
        }
        
        um.add(function() {
            unaddVisual(slide, visual);
            self.updateVisuals();
        }, ActionGroups.Visual_Group);
        
        return visual;
    }
    
    function doShiftVisual(visual, amount) {
        visual.tMin += amount;
        var vert_iter = visual.access().vertices();
        while(vert_iter.hasNext()) {
            var vert = vert_iter.next();
            vert.t += amount;
        }
    }
    
    this.shiftVisuals = function(visuals, amount) {
        for(var vis in visuals) { doShiftVisual(visuals[vis], amount); }
        
        //black magic, move to beginning?
        var shift = um.addToStartOfGroup(ActionGroups.Recording_Group, function() {
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
        }, ActionGroups.Visual_Group);
        pentimento.lecture_controller.visuals_controller.updateVisuals();
    }
    
    this.deleteVisuals = function(slide, visuals) {
        var indices = [];
        var segments = segmentVisuals(visuals);
        var shifts = getSegmentsShifts(segments);
        shifts.reverse();
        
        console.log("pre-DELETION visuals"); console.log(state.current_slide.visuals);
        console.log("DELETION shifts"); console.log(shifts);
        
        for(var vis in visuals) { //remove the visuals from the slide
            var index = state.current_slide.visuals.indexOf(visuals[vis]);
            state.current_slide.visuals.splice(index, 1);
            indices.push(index);
            if(index==-1) { console.log('error in deletion, a visual could not be found on the slide given'); }
        }
        
        console.log("post-DELETION visuals"); console.log(state.current_slide.visuals);
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            for(var vis in state.current_slide.visuals) {
                var visual = state.current_slide.visuals[vis];
                if(visual.tMin >= shift.tMin ) { doShiftVisual(visual, -1.0*shift.duration); } //visual.tMin-1.0*shift.duration
            }
        }
        shifts.reverse();
        
        //should we change the duration of the slide?!?
        um.add(function() {
            undeleteVisuals(state.current_slide, visuals, indices, shifts);
        }, ActionGroups.Visual_Group);
        pentimento.lecture_controller.visuals_controller.updateVisuals();
    }

    this.updateVisuals = function() {
        //renderer code. temporary stint until renderer code gets well integrated
        clear();
        var slide_iter = pentimento.lecture_controller.get_lecture_accessor().slides();
        var slide_time = state.current_time;
        var visuals = [];
        while(slide_iter.hasNext()) {
            var slide = slide_iter.next();
            if(slide==state.current_slide) { //if(running_time + slide_accessor.duration() < pentimento.state.current_time) //
                var visuals_iter = slide.access().visuals();
                while(visuals_iter.hasNext()) {
                    var visual_access = visuals_iter.next().access();
                    if(slide_time > visual_access.tMin()) { draw_visual(visual_access); }
                }
            } else {
                slide_time -= slide.duration;
            }
        }
    }
    /************* HELPER FUNCTIONS *************/
    function prevNeighbor(visual) {
        var prev;
        for(vis in state.current_slide.visuals) {
            var tMin = state.current_slide.visuals[vis].tMin;
            if(tMin < visual.tMin && (prev==undefined || tMin > prev.tMin)) {
                prev = state.current_slide.visuals[vis];
            }
        }
        return prev;
    }

    function nextNeighbor(visual) {
        var next;
        for(vis in state.current_slide.visuals) {
            var tMin = state.current_slide.visuals[vis].tMin;
            if(tMin > visual.tMin && (next==undefined || tMin < next.tMin)) {
                next = state.current_slide.visuals[vis];
            }
        }
        return next;
    }
    
    function modifyVisual(obj, field, new_val) {
        //undo manager push here!
        obj[field] = new_val;
    }
    
    function segmentVisuals(visuals) {
        //returns an array of segments, where each segment consists of a set of contiguous visuals
        function cmp_visuals(a, b) {
            if(a.tMin < b.tMin) {
                return -1;
            }
            if (b.tMin > a.tMin) {
                return 1;
            }
            return 0;
        }
        function cmp_segments(a, b) {
            //only to be used if each segment is sorted!
            if (a[0].tMin < b[0].tMin) {
                return -1;
            }
            if (b[0].tMin > a[0].tMin) {
                return 1;
            }
            return 0;
        }
        var visuals_copy = visuals.slice();
        var segments = [];
        var segment = [];
        var endpoints; //just pointers
        while(visuals_copy.length>0) {
            endpoints = [visuals_copy[0]];
            while(endpoints.length>0) {
                var visual = endpoints.shift();
                segment.push(visual);
                visuals_copy.splice(visuals_copy.indexOf(visual), 1);
                var prev_vis = prevNeighbor(visual);
                var next_vis = nextNeighbor(visual);
                if(visuals_copy.indexOf(prev_vis) > -1) {
                    endpoints.push(prev_vis);
                }
                if(visuals_copy.indexOf(next_vis) > -1) {
                    endpoints.push(next_vis);
                }
            }
            segment.sort(cmp_visuals);
            segments.push(segment);
            segment = [];
        }
        segments.sort(cmp_segments);
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