pentimento.visuals_controller = new function() {
    var _lecture;
    var group_name = "Visuals_Controller_Group";
    this.set_lecture = function(lecture) {
        _lecture = lecture;
    };
    
    this.update_visuals = function() {
        clear();
        var slide_accessors = pentimento.lecture_controller.get_lecture_accessor().slides();
        var running_time = 0;
        var visuals = [];
        for(var i in slide_accessors) {
            var slide_accessor = slide_accessors[i];
            if(running_time + slide_accessor.duration() < pentimento.state.current_time) {
                running_time += slide_accessor.duration();
            } else {
                var visual_accessors = slide_accessor.visuals();
                for(var vis in visual_accessors) {
                    var visual_accessor = visual_accessors[vis];
                    if(running_time + visual_accessor.tMin() <= pentimento.state.current_time) {
                        draw_visual(visual_accessor);
                    }
                }
                running_time+= slide_accessor.duration();
            }
        }
    };
    
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
    
//    this.shift_visual = function(visual, amount) {
//        //shift an entire visual by some amount in time
//        visual.tMin += amount;
//        for(vert in visual.vertices) {
//            visual.vertices[vert]['t'] += amount;
//        }
//    }
//
//    this.shift_visuals = function(start_time, amount) {
//        //start_time is relative to the slide, not global
//        var visuals = state.current_slide.visuals;
//        for(vis in visuals) {
//            var visual = visuals[vis];
//            if(visual.tMin >= start_time) {
//                shift_visual(visual, amount);
//            }
//        }
//    }
    
    this.shift_visuals = function(to_slide, from_slide, insertion_time) {
        for(var vis in to_slide.visuals) {
            var visual = to_slide.visuals[vis];
            if (visual.tMin >= insertion_time) { //shift visuals in the to_slide
                visual.tMin += from_slide.duration;
            }
        }
    }
    
    function segment_visuals(visuals) {
        //returns an array of contiguous visuals
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
    
    this.delete_visuals = function(visuals) {
        //handles both shifting of the visuals in time and removal from within the visuals
        var segments = segment_visuals(visuals);
        var shifts = get_segments_shift(segments);
        shifts.reverse();
        console.log("DELETION", shifts);
        for(vis in visuals) {
            var index = state.current_slide.visuals.indexOf(visuals[vis]);
            state.current_slide.visuals.splice(index, 1);
        }
        for(sh in shifts) {
            var shift = shifts[sh];
            shift_visuals(shift['tMin'], -1.0*shift['duration']);
        }
        //should we change the duration of the slide?!?
        shifts.reverse();
        return shifts;
    }

    this.redraw_visuals = function(old_visuals, new_visuals) {
        var shifts = this.delete_visuals(old_visuals);
        if(new_visuals.length==0) {return ;}

        var duration = get_segments_shift([new_visuals])[0]['duration'];
        console.log('duration', duration);
        var offset = new_visuals[0].tMin - shifts[0]['tMin'];
        shift_visuals(shifts[0]['tMin'], duration);
        for(vis in new_visuals) {
            shift_visual(new_visuals[vis], -1.0*offset);
            state.current_slide.visuals.push(new_visuals[vis]);   
        }
        state.current_slide.duration += duration;
    }
};