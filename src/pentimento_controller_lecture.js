pentimento.lecture_controller = new function() {
    var lecture = new pentimento.lecture();
    var state = pentimento.state;
    var interval;
    var recording_params;

    this.get_lecture = function() {
        return lecture;
    };

    this.get_lecture_duration = function() {
        return 0;
    }

    this.set_slide_by_time = function(time) {
        var total_duration = 0; //something...something...equals?
        for(slide in lecture.slides) {
            if(time >= total_duration && time <= total_duration+lecture.slides[slide].duration) {
                state.current_slide = lecture.slides[slide];
                return ;
            } else {
                total_duration += lecture.slides[slide].duration;
            }
        }
    }

    this.rewind = function() {
        //TODO
        //should really seek a more previous slide change
        var idx = lecture.slides.indexOf(state.current_slide);
        var t = 0;
        for(var i=0; i<idx; i++) {
            t += lecture.slides[i].duration;
        }
        state.current_time = t+1;//so hackish
    }

    this.full_rewind = function() {
        state.current_time = 0;
        if(!lecture.slides) {
            return ;
        }
        state.current_slide = lecture.slides[0];
    }

    this.begin_recording = function() {
        if(!state.current_slide) {
            recording_params = {
                'current_slide':null,
                'time_in_slide':null
            }
        } else {
            var total_duration = 0;
            for(slide in lecture.slides) { //something...equals...something...
                if (state.current_time > total_duration && state.current_time <= total_duration+lecture.slides[slide].duration) {
                    recording_params = {
                        'current_slide': slide,
                        'time_in_slide': state.current_time - total_duration
                    };
                } else {
                    total_duration += lecture.slides[slide].duration;
                }
            }
        }
    }



    this.update_gradations = function() {

    }

    

    function insert_slide_into_slide(to_slide, from_slide, insertion_time) {
        //insertion time is in the to_slide
        for(vis in to_slide.visuals) {
            var visual = to_slide.visuals[vis];
            if (visual.tMin >= insertion_time) { //shift visuals in the to_slide
                shift_visual(visual, from_slide.duration);
            }
        }
        for(vis in from_slide.visuals) {
            var visual = $.extend({}, from_slide.visuals[vis], true); //make a deep copy
            visual.tMin += insertion_time;
            to_slide.visuals.push(visual);
        }
        to_slide.duration += from_slide.duration;
    }

    this.insert_recording = function(recording) {
        if(recording_params['current_slide']==null) {
            lecture = recording;
        } else {
            // Update the audio
            lecture.audio_tracks = recording.tracks;
            console.log(lecture.audio_tracks);

            // Update the visuals
            var slide = lecture.slides[recording_params['current_slide']];
            insert_slide_into_slide(slide, recording.slides.shift(), recording_params['time_in_slide']);
            
            var before = [];
            var after = lecture.slides;
            for(var i=0; i<=recording_params['current_slide']; i++) {
                before.push(after.shift());
            } //separate slides to before and after those to be inserted

            if(recording.slides.length!=0) {
                //accumulate times up to sum of all in params['current_slide'] and
                //all of recording.slides. then change state.current_time
                //TODO TODO TODO TODO TODO

                for(var i=0; i<lecture.slide_changes.length; i++) {
                    var change = lecture.slide_changes[i];
                    if(change['from_slide'] == recording_params['current_slide']) {
                        lecture.slide_changes.splice(i, 1); //remove it
                        break;
                    }
                }
                //TODO FIX
            }
            lecture.slides = before.concat(recording.slides.concat(after));
        }
        //update the ticker...handled in other code
        this.set_slide_by_time(pentimento.state.current_time); //also wrong since current_time is not updated.
    }

    function shift_visual(visual, amount) {
        //shift an entire visual by some amount in time
        visual.tMin += amount;
        for(vert in visual.vertices) {
            visual.vertices[vert]['t'] += amount;
        }
    }

    function shift_visuals(start_time, amount) {
        //start_time is relative to the slide, not global
        var visuals = state.current_slide.visuals;
        for(vis in visuals) {
            var visual = visuals[vis];
            if(visual.tMin >= start_time) {
                shift_visual(visual, amount);
            }
        }
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

    //DEBUGGING PURPOSES ONLY
    this.log_lecture = function() {
        console.log(lecture);
        window.lec = lecture;
    }

    this.log_visuals = function() {
        console.log(state.current_slide.visuals);
        window.viz = state.current_slide.visuals;
    }
};

$(document).ready(function() {
    // lecture.slide_changes.push({from_slide:-1, to_slide:0, time:0})
    // console.log('lecture created');
    
    // var logger = $('<button>LOG-LECTURE</button>');
    // $(logger).click(pentimento.lecture_controller.log_lecture);
    // $('body div:first').append(logger);

    // var logger2 = $('<button>LOG-VISUALS</button>');
    // $(logger2).click(pentimento.lecture_controller.log_visuals);
    // $('body div:first').append(logger2);

    var audio_controller = new pentimento.audio_controller();
    audio_controller.init();
});