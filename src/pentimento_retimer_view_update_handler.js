// View Elements
var retimer_constraints = 'retimer_constraints';
var thumbnails_div = 'thumbnails_div';

function drawThumbnails(currZoom, zoomFactor){
    if(window.opener != null){
        var numThumbs;
        console.log("drawingThumb Zoom: " + currZoom);
        var max_time = window.opener.pentimento.lectureController.getLectureDuration();
        console.log("lectureLength: " + max_time);

        // If zoom is 1 (default) draw one thumbnail for every second (time measured in ms)
        var thumbZoom = Math.round(currZoom/zoomFactor);
        currZoom = thumbZoom;

        if($('#' + thumbnails_div).children().length == 0){
            // original recording, draw thumbs as expected
            numThumbs = Math.ceil(max_time/thumbZoom);

            $('#' + thumbnails_div).data('currmax', max_time);

            for(var i=0; i<numThumbs; i++){
                var thumbOffset = i;
                var curr_min = i*thumbZoom;
                var curr_max = (i+1)*thumbZoom;
                if((i+1) == numThumbs){
                    curr_max = max_time;
                }
                generateThumbnails(currZoom, thumbOffset, curr_min, curr_max);
            }
        }
        else if($('#' + thumbnails_div).data('endrecord') == max_time){
            // adding recording to the end
            console.log('THUMBNAILS EXIST');

            var prev_max = $('#' + thumbnails_div).data('currmax');
            $('#' + thumbnails_div).data('currmax', max_time);

            numThumbs = Math.ceil((max_time-prev_max)/thumbZoom);

            var last_thumb = $("#thumbnails_div :last-child").attr('id');
            var last_thumb_split = last_thumb.split('_');
            var last_thumb_num = last_thumb_split[last_thumb_split.length-1];
            var curr_thumb = parseInt(last_thumb_num) + 1;

            for(var i=0; i<numThumbs; i++){
                var thumbOffset = curr_thumb + i;

                var curr_min = (curr_thumb+i)*thumbZoom;
                var curr_max = (curr_thumb+i+1)*thumbZoom;
                if((i+1) == numThumbs){
                    curr_max = max_time;
                }
                generateThumbnails(currZoom, thumbOffset, curr_min, curr_max);
            }

        }
        else{
            console.log("THUMBNAILS BEING INSERTED");
            insertThumbnails(currZoom, thumbOffset, curr_min, curr_max);
        }
    }
}

function generateThumbnails(currZoom, thumbOffset, curr_min, curr_max){
    var thumbTime = Math.round((curr_min + curr_max)/2);

    // draw the image in the middle of the time interval represented by the thumbnail
    var slides = window.opener.pentimento.lecture.getSlidesIterator();
    var slideTime = window.opener.pentimento.state.videoCursor;
    var firstVisual = true;
    while(slides.hasNext()){
        var slide = slides.next();
        var visuals = slide.getVisualsIterator();

        while(visuals.hasNext()){
            var visual = visuals.next();
            var curr_tMin = visual.getTMin();

            if(curr_tMin < thumbTime){
                var thumbParams = {'thumbOffset': thumbOffset, 'firstVisual' : firstVisual, 'currZoom' : currZoom, 'timeMin' : curr_min, 'timeMax' : curr_max, 'thumbTime' : thumbTime};
                drawVisual(visual,slideTime,true,thumbParams);
            }

            firstVisual = false;

        }
    }
}

function insertThumbnails(currZoom, thumbOffset, curr_min, curr_max){
    var last_thumb = $("#thumbnails_div :last-child").attr('id');
    var last_thumb_split = last_thumb.split('_');
    var last_thumb_num = last_thumb_split[last_thumb_split.length-1];
    var max_kept_thumb = parseInt(last_thumb_num);
    var max_kept_thumb_time = $('#' + last_thumb).data('timemax');
    console.log("max_kept_thumb_time " + max_kept_thumb_time);
    var max_set = false;

    var insert_start = $('#' + thumbnails_div).data('beginrecord');

    console.log('insert_start ' + insert_start);


    $('#' + thumbnails_div).children().each(function () {
        console.log("canvas_id " + this.id);
        console.log("thumbTime " + $(this).data('timemax'));

        var thumb_id = this.id;
        var thumb_id_split = thumb_id.split('_');
        var thumb_num = thumb_id_split[thumb_id_split.length-1];
        var curr_num = parseInt(thumb_num);

        var thumb_end_time = $(this).data('timemax');
        if(thumb_end_time > insert_start){
            if(!max_set){
                max_kept_thumb = curr_num-1;
            }
            max_set = true
        }
        if(!max_set){
            max_kept_thumb_time = thumb_end_time
        }
        

        // if(thumb_end_time > insert_start){
        //  if(!max_set){
        //      max_kept_thumb = curr_num-1;
        //      max_kept_thumb_time = prev_max;
        //      max_set = true;
        //  }
        // }

        if(curr_num > max_kept_thumb){
            console.log("CACHINNNNNGGG");
            // console.log($(this));
            // $('#thumbnails_cache').append($(this));
            $(this).remove();
        }
    });

    var numThumbs = Math.ceil((max_time-max_kept_thumb_time)/thumbZoom);

    console.log('numThumbs: ' + numThumbs + ", max_time: " + max_time + ", thumb_max_time: " + max_kept_thumb_time + ", max_kept_thumb: " + max_kept_thumb);

    for(var i=0; i<numThumbs; i++){
        console.log("i: "+ i)
        var thumbOffset = max_kept_thumb + i;

        var curr_min = (max_kept_thumb+i)*thumbZoom;
        var curr_max = (max_kept_thumb+i+1)*thumbZoom;
        if((i+1) == numThumbs){
            curr_max = max_time;
        }
        // draw the image in the middle of the time interval represented by the thumbnail
        var thumbTime = Math.round((curr_min + curr_max)/2);
        console.log("curr_min: " + curr_min + ", curr_max: " + curr_max);
        console.log("thumbTime: " + thumbTime);

        var slides = window.opener.pentimento.lecture.getSlidesIterator();
        var slideTime = window.opener.pentimento.state.videoCursor;
        var firstVisual = true;
        while(slides.hasNext()){
            var slide = slides.next();
            var visuals = slide.getVisualsIterator();

            while(visuals.hasNext()){
                var visual = visuals.next();
                var curr_tMin = visual.getTMin();

                if(curr_tMin < thumbTime && curr_tMin > max_kept_thumb_time){
                    var thumbParams = {'thumbOffset': thumbOffset, 'firstVisual' : firstVisual, 'currZoom' : currZoom, 'timeMin' : curr_min, 'timeMax' : curr_max, 'thumbTime' : thumbTime };
                    drawVisual(visual,slideTime,true,thumbParams);
                }

                firstVisual = false;

            }
        }
    }
}

function scaleThumbs(tVisOld, tVisPrev, tVisNew, tVisNext){

    // function scaleThumbs(zoomFactor, tMin, tMax)
    // console.log("ZOOMING");

    // var currZoom = $('#' + thumbnails_div).data('currzoom');   

    // console.log("zoomInCurrZoom: " + currZoom);
    console.log("old: " + tVisOld);
    console.log("new: " + tVisNew);
    console.log("prev: " + tVisPrev);
    console.log("next: " + tVisNext);

    var scalePrev = (tVisOld - tVisPrev)/(tVisNew - tVisPrev);
    var scaleNext = (tVisNext - tVisOld)/(tVisNext - tVisNew);

    console.log("ScalePrev: " + scalePrev);
    console.log("scaleNext: " + scaleNext);

    var currZoom = $('#' + thumbnails_div).data('currzoom');
    // $('#' + thumbnails_div).html('');
    // drawThumbnails(currZoom, zoomFactor);
    $('#' + thumbnails_div).children().each(function () {
        console.log(this);
        console.log("type: " + (typeof this))
        var id = this.id;
        console.log("canvas_id " + this.id);
        console.log("canvasMinTime:" + $('#' + id).data('timemin'));
        console.log("canvasMaxTime: " + $('#' + id).data('timemax'));
        var currTMin = $('#' + id).data('timemin');
        var currTMax = $('#' + id).data('timemax');

        if(currTMin > tVisPrev && currTMax < tVisNext){
            $('#thumbnails_cache').append('<span>SCALING</span>');
        }
        else{
            var htmlStr = $('#' + id).prop('outerHTML');
            console.log("str: " + htmlStr);
            $('#thumbnails_cache').append('<span>KEEP</span>');
            $('#thumbnails_cache').append(htmlStr);
        }
        // $('#' + thumbnails_div).remove('#' + id);
    });
     $('#' + thumbnails_div).empty();
}

function drawConstraint(constraint_num){
    $('#' + retimer_constraints).on('mousedown', function addArrow(e){

        var x = e.pageX;
        var y = e.pageY;

        addConstraintToLec(x);

        var arrow_name = "arrow_"+constraint_num;
        var visuals_constraint = "visuals_constraint"+constraint_num;
        var audio_constraint = "audio_constraint"+constraint_num;

            $('#' + retimer_constraints).drawLine({
                    layer: true,
                    name: arrow_name,
                    strokeStyle: '#000',
                    strokeWidth: 4,
                    rounded: true,
                    x1: x, y1: 185,
                    x2: x, y2: 15
                })
                .drawArc({
                    layer: true,
                    name: visuals_constraint,
                    draggable: true,
                    fillStyle: '#000',
                    x: x, y: 15,
                    radius: 10,
                    drag: function(layer){
                        constraintDrag(visuals_constraint, audio_constraint, 15, arrow_name)
                    },
                    dragstop: function(layer){
                        updateVisualConstraint(visuals_constraint, audio_constraint);
                    }
                })
                .drawArc({
                    layer: true,
                    name: audio_constraint,
                    draggable: true,
                    fillStyle: '#000',
                    x: x, y: 185,
                    radius: 10,
                    drag: function(layer) {
                        constraintDrag(audio_constraint, visuals_constraint, 185, arrow_name);
                    },
                    dragstop: function(layer){
                        updateAudioConstraint(audio_constraint, visuals_constraint);
                    }
                });
                    
        $('#' +retimer_constraints).unbind('mousedown', addArrow);    
    });
}

function constraintDrag(drag_name, anchor_name, yVal, arrow_id){
    // console.log("x: " + $('#' + retimer_constraints).getLayer(drag_name).x);
    // console.log("y: " + $('#' + retimer_constraints).getLayer(drag_name).y);
    $('#' + retimer_constraints).setLayer(drag_name,{                     
        x: $('#' + retimer_constraints).getLayer(drag_name).x , y: yVal,
    })
    $('#' + retimer_constraints).setLayer(arrow_id,{                   
        x1: $('#' + retimer_constraints).getLayer(anchor_name).x , y1: $('#' + retimer_constraints).getLayer(anchor_name).y,
        x2: $('#' + retimer_constraints).getLayer(drag_name).x , y2: yVal
    })
}

function addConstraintToLec(xVal){
    console.log("adding!");

    // FORUMULAS
    // interp_factor = (curr_time-prev_time)/(next_time-prevX)
    // constraint_tVis = (next_time-prev_time)*interp_factor + prev_tVis
    // constraint_tAud = (next_time-prev_time)*interp_factor + prev_tAud

    // Make sure to convert this from the lecture duration to audio duration
    var audio_scale = window.opener.pentimento.lectureController.getLectureDuration()/$('#' + retimer_constraints).width();
    console.log("scale: " + audio_scale);
    var tAud = xVal * audio_scale;
    console.log("taud: " + tAud);
    var tVis = window.opener.pentimento.lectureController.retimingController.getVisualTime(tAud);
    console.log("tvis: " + tVis);
    // var prev_const = window.opener.pentimento.lectureController.retimingController.getPreviousConstraint(curr_audio_time, "Audio");
    // var next_const = window.opener.pentimento.lectureController.retimingController.getNextConstraint(curr_audio_time, "Audio");
    // var prevTime = prev_const.getTVisual();
    // var nextTime = next_const.getTVisual();
    // console.log(nextTime);
    // var prevX = 0;
    // var nextX = $('#' + retimer_constraints).width();
    // console.log(nextX);
    // var interp = (nextTime-prevTime)/(nextX-prevX);
    // console.log("interp: " + interp);
    // var tVis = interp*xVal;
    // var tAud = interp*xVal;
    var constraint = new Constraint(tVis, tAud, ConstraintTypes.Manual);
    window.opener.pentimento.lectureController.retimingController.addConstraint(constraint);
}

function updateVisualConstraint(visual_name, audio_name){
    console.log("dragged to: " + $('#' + retimer_constraints).getLayer(visual_name).x);
    console.log("anchor at: " + $('#' + retimer_constraints).getLayer(audio_name).x);

    var audio_scale = window.opener.pentimento.lectureController.getLectureDuration()/$('#' + retimer_constraints).width();

    var tAud = $('#' + retimer_constraints).getLayer(audio_name).x * audio_scale;
    // var oldtVis = window.opener.pentimento.lectureController.retimingController.getVisualTime(tAud);
    // console.log("oldtVis: " + oldtVis);
    var prev_const = getPreviousConstraint(tAud, "Audio");
    var next_const = getNextConstraint(tAud, "Audio");
    var prevTVis = prev_const.getTVisual();
    var nextTVis = next_const.getTVisual();

    var newVisXVal = $('#' + retimer_constraints).getLayer(visual_name).x;
    var draggedTAud = newVisXVal * audio_scale;
    var newTVis = window.opener.pentimento.lectureController.retimingController.getVisualTime(draggedTAud);
    console.log("newTVis: " + newTVis);
    
    var constraints = window.opener.pentimento.lecture.getConstraintsIterator();

    var oldTVis;
    while(constraints.hasNext()){
        var constraint = constraints.next();
        var currTAud = constraint.getTAudio();
        console.log("currAudio: " + currTAud);

        if(currTAud == tAud){
            console.log("SETTING!");
            oldTVis = constraint.getTVisual();
            constraint.setTVisual(newTVis);
            break;
        }
    }

    // var prev_const = window.opener.pentimento.lectureController.retimingController.getPreviousConstraint(tAud, "Audio");
    // var next_const = window.opener.pentimento.lectureController.retimingController.getNextConstraint(tAud,"Audio");
    scaleThumbs(oldTVis, prevTVis, newTVis, nextTVis);

}

function updateAudioConstraint(audio_name, visual_name){
    var audio_scale = window.opener.pentimento.lectureController.getLectureDuration()/$('#' + retimer_constraints).width();
    var tVis = $('#' + retimer_constraints).getLayer(visual_name).x * audio_scale;

    var newTAud = $('#' + retimer_constraints).getLayer(audio_name).x * audio_scale;

    var constraints = window.opener.pentimento.lecture.getConstraintsIterator();

    while(constraints.hasNext()){
        var constraint = constraints.next();
        var currTVis = constraint.getTVisual();
        console.log("currVis: " + currTVis);

        if(currTVis == tVis){
            console.log("SETTING!");
            constraint.setTAudio(newTAud);
            break;
        }
    }
}

function getPreviousConstraint(time, type) {
    if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getPreviousConstraint'); return; }

    var constraints = window.opener.pentimento.lecture.getConstraints();
    var best;
    if(type=="Audio") {
        for(var i in constraints) {
            var constraint = constraints[i];
            if(constraint.getTAudio() >= time) { break; }
            best = constraint;
        }
    } else if(type=="Video") {
        for(var i in constraints) {
            var constraint = constraints[i];
            if(constraint.getTVisual() >= time) { break; }
            best = constraint;
        }
    }
    return best;
}

function getNextConstraint(time, type) {
    if(type!="Audio" && type!="Video") { console.log('passed in an invalid type to getNextConstraint'); return; }

    var constraints = window.opener.pentimento.lecture.getConstraints();
    constraints.reverse();
    var best;
    if(type=="Audio") {
        for(var i in constraints) {
            var constraint = constraints[i];
            if(constraint.getTAudio() <= time) { break; }
            best = constraint;
        }
    } else if(type=="Video") {
        for(var i in constraints) {
            var constraint = constraints[i];
            if(constraint.getTVisual() <= time) { break; }
            best = constraint;
        }
    }
    constraints.reverse();
    return best;
}

function drawAutomaticConstraint(tVis, tAud){
        console.log("AUTO CONSTRAINTTT");
            var arrow_name = "auto_"+tVis;
            var visuals_constraint = "visuals_constraint"+constraint_num;
            var audio_constraint = "audio_constraint"+constraint_num;

            $('#' + retimer_constraints).drawLine({
                layer: true,
                name: arrow_name,
                strokeStyle: '#BDBDBD',
                strokeWidth: 4,
                rounded: true,
                x1: tAud, y1: 185,
                x2: tVis, y2: 15
            })
            .drawArc({
                layer: true,
                name: visuals_constraint,
                draggable: true,
                fillStyle: '#BDBDBD',
                x: tVis, y: 15,
                radius: 10,
                drag: function(layer) {
                    console.log("x: " + $('#' + retimer_constraints).getLayer(visuals_constraint).x);
                    console.log("y: " + $('#' + retimer_constraints).getLayer(visuals_constraint).y);
                    $('#' + retimer_constraints).setLayer(visuals_constraint,{                    
                        x: $('#' + retimer_constraints).getLayer(visuals_constraint).x , y: 15,
                    })
                    $('#' + retimer_constraints).setLayer(arrow_name,{                    
                        x1: $('#' + retimer_constraints).getLayer(visuals_constraint).x , y1: 15,
                        x2: $('#' + retimer_constraints).getLayer(audio_constraint).x , y2: $('#' + retimer_constraints).getLayer(audio_constraint).y
                    })

                }
            })
            .drawArc({
                layer: true,
                name: audio_constraint,
                draggable: true,
                fillStyle: '#BDBDBD',
                x: x, y: 185,
                radius: 10,
                drag: function(layer) {
                    console.log("x: " + $('#' + retimer_constraints).getLayer(audio_constraint).x);
                    console.log("y: " + $('#' + retimer_constraints).getLayer(audio_constraint).y);
                    $('#' + retimer_constraints).setLayer(audio_constraint,{                      
                        x: $('#' + retimer_constraints).getLayer(audio_constraint).x , y: 185,
                    })
                    $('#' + retimer_constraints).setLayer(arrow_name,{                    
                        x1: $('#' + retimer_constraints).getLayer(visuals_constraint).x , y1: $('#' + retimer_constraints).getLayer(visuals_constraint).y,
                        x2: $('#' + retimer_constraints).getLayer(audio_constraint).x , y2: 185
                    })

                }
            });
}

/*function extendRetimingConstraintsCanvas(){
    console.log("HEREEE")
    var new_width = $('#' + thumbnails_div).width();
    var curr_width = $('#' + retimer_constraints).width();

    var scale = curr_width/new_width;
    console.log("scale: " + scale);

    $('#' + retimer_constraints).saveCanvas();
    // $('#prev_constraints').width(curr_width);
    // $('#prev_constraints').height(200);

    // $('#' + retimer_constraints).setLayers({
    //  scaleX: scale,
    //  scaleY: 1
    // })

    // var curr_layers = $('#' + retimer_constraints).getLayers();
    // curr_layers.reverse();
    // console.log(curr_layers);
    // curr_layers.reverse();
    // for(i=0; i < curr_layers.length; i++){
    //  curr_layers[i].scaleX(scale);
    //  curr_layers[i].scaleY(1);
    // }


    // $('#prev_constraints').drawLayers(curr_layers);
    

    $('#' + retimer_constraints).width(new_width);
    $('#' + retimer_constraints).height(200);
    $('#' + retimer_constraints).restoreCanvas();
    // $('#' + retimer_constraints).drawLayers();
    // var new_layers = $('#' + retimer_constraints).getLayers();
    // console.log(new_layers);



    // $('#constraints_div').css({
 //         'width' : curr_width,
 //         'height' : "200px"
 //    });
    // $('#' + retimer_constraints).css({
 //         'width' : curr_width,
 //         'height' : "200px"
 //    });


    // $('#prev_constraints').width(curr_width);
    // $('#prev_constraints').height(200);
    // $('#prev_constraints').drawImage({
    //    source: $('#' + retimer_constraints).getCanvasImage(),
    //    x: 0, y: 0
    //  }); 
    // // $('#' + retimer_constraints).css({
 // //         'width' : new_width,
 // //         'height' : 200
 // //    });
    // $('#' + retimer_constraints).width(new_width);
    // $('#' + retimer_constraints).height(200);
 //    $('#' + retimer_constraints).drawImage({
    //    source: $('#prev_constraints').getCanvasImage(),
    //    x: 0, y: 0
    //  });

}*/