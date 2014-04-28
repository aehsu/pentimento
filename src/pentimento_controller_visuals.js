function VisualsController(lecture) {
    var self = this;
    var _lecture = lecture;
    var state = pentimento.state;
    var group_name = "Visuals_Controller_Group";
    
    this.delete_visual = function(slide, visual) {
        var idx = _lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return; }
        idx = slide.visuals.indexOf(visual);
        if(idx==-1) { console.log("Error in delete visual for the visuals controller"); return;}
        
        slide.visuals.splice(idx, 1);
        
        um.add(function() {
            self.add_visual(slide, visual);
            self.update_visuals();
        }, group_name);
    }
    
    this.add_visual = function(slide, visual) {
        var idx = _lecture.slides.indexOf(slide);
        if(idx==-1) { console.log("Error in add visual for the visuals controller"); return; }
        
        slide.visuals.push(visual);
        
        um.add(function() {
            self.delete_visual(slide, visual);
            self.update_visuals();
        }, group_name);
    }
    
    function do_shift_visuals(visuals, amount) {
        for(var vis in visuals) {
            visuals[vis].tMin += amount;
            var vert_iter = visuals[vis].access().vertices();
            while(vert_iter.hasNext()) {
                var vert = ver_iter.next();
                vert.t += amount;
            }
        }
    }
    
    this.shift_visuals = function(visuals, amount) {
        do_shift_visuals(visuals, amount);
        
        //black magic, move to beginning?
        um.add(function() {
            do_shift_visuals(visuals, -1.0*amount);
        }, group_name);
    }
    
    this.update_visuals = function() {
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
    
    function do_deletion(visuals) {
        //handles both shifting of the visuals in time and removal from within the visuals
        var segments = segment_visuals(visuals);
        var start_time = segments[0][0].tMin;
        var shifts = get_segments_shift(segments);
        shifts.reverse();
        console.log("pre-DELETION visuals")
        console.log(state.current_slide.visuals);
        console.log("DELETION shifts");
        console.log(shifts);
        for(var vis in visuals) { //remove the visuals from the 
            var index = state.current_slide.visuals.indexOf(visuals[vis]);
            //undo manager logic
            state.current_slide.visuals.splice(index, 1);
        }
        console.log("post-DELETION visuals");
        console.log(state.current_slide.visuals);
        for(var sh in shifts) {
            var shift = shifts[sh];
            for(var vis in state.current_slide.visuals) {
                var visual = state.current_slide.visuals[vis];
                if(visual.tMin >= start_time) {
                   modify_visual(visual, 'tMin', visual.tMin-1.0*shift.duration)
               }
            }
        }
        //should we change the duration of the slide?!?
        shifts.reverse();
        return shifts;
    }
    
    this.delete_visuals = function(visuals) {
        do_deletion(visuals);
    }

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
    
    function modify_visual(obj, field, new_val) {
        //undo manager push here!
        obj[field] = new_val;
    }
    
    function segment_visuals(visuals) {
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

    function get_segments_shift(segments) {
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