/* TODO:
    1) Make sure that global time/audio time is used in all appropriate places instead of visual time
        1a) figure out where it is appropriate to use visual time (i.e. if there is no audio recording)
    2) Make this into a controller...
*/
var RetimerController = function(retimer_model, visuals_controller, audio_controller) {

    var retimerModel = retimer_model;
    var thumbnailsController = new ThumbnailsController(visuals_controller);

    // Draw the constraint on the constraints canvas (for manual/user added constraints)
    // constraint_num: unique id for each constraint added (incremented by the retimer)
    function drawConstraint(constraint_num){
        $('#retimer_constraints').on('mousedown', function addArrow(e){
            // See where the user clicked to add the constraint
            var x = e.pageX;
            var y = e.pageY;

            // Add the constraint tothe lecture (at the time calculated by the position on the constraints canvas)
            addConstraintToLec(x);

            // Give the constraint an id
            var arrow_name = "arrow_"+constraint_num;
            var visuals_constraint = "visuals_constraint"+constraint_num;
            var audio_constraint = "audio_constraint"+constraint_num;

            // Use jcanvas to draw the constraint.  Draw the constraint at the x value of where the user clicked on the canvas
            // Visuals_constraint is the end of the line attached to the visuals, audio_constraint is pointing to the audio
            // TODO: Make an arrow instead of a line with dots on the end
            $('#retimer_constraints').drawLine({
                    layer: true,
                    name: arrow_name,
                    bringToFront: true,
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
                    bringToFront: true,
                    fillStyle: '#000',
                    x: x, y: 15,
                    radius: 10,
                    drag: function(layer){
                        constraintDrag(visuals_constraint, audio_constraint, 15, arrow_name)
                    },
                    dragstop: function(layer){
                        updateVisualConstraint(constraint_num, visuals_constraint, audio_constraint, arrow_name);
                    }
                })
                .drawArc({
                    layer: true,
                    name: audio_constraint,
                    draggable: true,
                    bringToFront: true,
                    fillStyle: '#000',
                    x: x, y: 185,
                    radius: 10,
                    drag: function(layer) {
                        constraintDrag(audio_constraint, visuals_constraint, 185, arrow_name);
                    },
                    dragstop: function(layer){
                        updateAudioConstraint(constraint_num, audio_constraint, visuals_constraint, arrow_name);
                    }

                });
            // Draw the constraint (using jcanvas)
            $('#retimer_constraints').drawLayers();

            // Unbind the click event from the constraints canvas (so that clicking can be used for other functions)
            $('#retimer_constraints').unbind('mousedown', addArrow);    
        });
    }

    // Drawing automatic constraints when new visuals or audio is added
    // tVis: visual time of auto constraint
    // tAud: audio time of auto constraint
    // TODO: use drag function, add dragstop, update automatic constraint
    function drawAutomaticConstraint(tVis, tAud){
        // Set the name of the constraint with unique ID
        var arrow_name = "auto_"+constraint_num;
        var visuals_constraint = "visuals_constraint"+constraint_num;
        var audio_constraint = "audio_constraint"+constraint_num;

        // Use jcanvas to draw the automatic constraint (in a lighter gray than the manual constraints)
        $('#retimer_constraints').drawLine({
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
                console.log("x: " + $('#retimer_constraints').getLayer(visuals_constraint).x);
                console.log("y: " + $('#retimer_constraints').getLayer(visuals_constraint).y);
                $('#retimer_constraints').setLayer(visuals_constraint,{                    
                    x: $('#retimer_constraints').getLayer(visuals_constraint).x , y: 15,
                })
                $('#retimer_constraints').setLayer(arrow_name,{                    
                    x1: $('#retimer_constraints').getLayer(visuals_constraint).x , y1: 15,
                    x2: $('#retimer_constraints').getLayer(audio_constraint).x , y2: $('#retimer_constraints').getLayer(audio_constraint).y
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
                console.log("x: " + $('#retimer_constraints').getLayer(audio_constraint).x);
                console.log("y: " + $('#retimer_constraints').getLayer(audio_constraint).y);
                $('#retimer_constraints').setLayer(audio_constraint,{                      
                    x: $('#retimer_constraints').getLayer(audio_constraint).x , y: 185,
                })
                $('#retimer_constraints').setLayer(arrow_name,{                    
                    x1: $('#retimer_constraints').getLayer(visuals_constraint).x , y1: $('#retimer_constraints').getLayer(visuals_constraint).y,
                    x2: $('#retimer_constraints').getLayer(audio_constraint).x , y2: 185
                })

            }
        });
    }

    // How dragging the constraints works
    // drag_name: either audio_constraint or visuals_constraint depending on which is being dragged
    // anchor_name: the end ofthe constraints staying anchored (audio_constraint or visuals_constraint, whichever is not being dragged)
    // yVal: the y coordinate of the constraint being dragged (So it is dragged along a fixed line)
    // arrow_id: unique ID associated with the constraint 
    function constraintDrag(drag_name, anchor_name, yVal, arrow_id){
        // Use jcanvas to drag the appropriate arrow (changing the x value)
        $('#retimer_constraints').setLayer(drag_name,{                     
            x: $('#retimer_constraints').getLayer(drag_name).x , y: yVal,
        })

        // Reset the constraint paramaters as it is being dragged
        $('#retimer_constraints').setLayer(arrow_id,{                   
            x1: $('#retimer_constraints').getLayer(anchor_name).x , y1: $('#retimer_constraints').getLayer(anchor_name).y,
            x2: $('#retimer_constraints').getLayer(drag_name).x , y2: yVal
        })
    }

    // Extend the retiming constraints canvas to match the width of the thumbnails so that users can draw constraints at any time
    // TODO: extend retiming constraints for audio as well
    function redrawConstraintsCanvas(){

        var scale = $('#thumbnails_div').height()/original_height;
        var thumbnail_width = Math.round(scale * original_width);

        // Get the number of thumbnails
        var numThumbs = $('#thumbnails_div').children().length;
        // Calculate the new width of the constraints drawing canvas
        var new_width = numThumbs*(thumbnail_width) + 2*(numThumbs-1) + 2;

        console.log("new: " + new_width);
        // var curr_width = $('#retimer_constraints').width();

        // var canvas_scale = new_width/curr_width;
        // console.log("scale: " + canvas_scale);

        // Clear the canvas of restraints
        $('#retimer_constraints').clearCanvas();

        // Create and draw the new canvas 
        var newCanvas = "<canvas id='retimer_constraints' height='200px' width='" + new_width + "px'></canvas>"
        $('#constraints_div').html(newCanvas);

        // $('#retimer_constraints').width(new_width);

        console.log("reset width? :" +  $('#retimer_constraints').width());

        // $('#constraints_div').css({
        //      'width' : new_width,
        //      'height' : "200px"
        // });
        // $('#retimer_constraints').css({
        //      'width' : new_width,
        //      'height' : "200px"
        // });
        // $('#retimer_constraints').scaleCanvas({
        //   x: 0, y: 0,
        //   scaleX: canvas_scale, scaleY: 1
        // })
        // .restoreCanvas();

        // Redraw the constraints
        redrawConstraints();
    }

    // Redraw the constriants when the canvas has been resized
    function redrawConstraints(){
        // Get the audio scale of the new canvas using the lecture duration (global time)
        var audio_scale = $('#retimer_constraints').width()/pentimento.lectureController.getLectureDuration();

        // Get all of the constraints currently added to the lecture
        var constraints = retimerModel.getConstraintsIterator();

        // Reset the ID of constraints to 0
        var constraint_num = 0;

        // Iterate through the constraints and redraw each one
        while(constraints.hasNext()){
            var constraint = constraints.next();

            // Get the audio time of the constraints and convert it to the position where to draw the constraint
            var tAud = constraint.getTAudio();
            var xVal = tAud * audio_scale;

            // If the constraint was manually drawn it should be black, if it was automatic it should be gray
            var type = constraint.getType();
            var color = '#000';
            if(type == 'Automatic'){
                color = '#BDBDBD';
            }

            // Redraw the constraint
            redrawConstraint(constraint_num, xVal, color);

            // Increment the ID number
            constraint_num += 1;
        } 

    }

    // Redraw an individual constraint
    // TODO: make this function just to draw a constraint and use it for drawing the constraints in addition to redrawing them
    // constraint_num: unique ID for the constraint
    // xVal: position where to draw the constraint
    // color: color of the constraint (automatic: gray, manual: black)
    function redrawConstraint(constraint_num, xVal, color){

        console.log("REDRAWING??");

        // Set the ID for the constraint
        var arrow_name = "arrow_"+constraint_num;
        var visuals_constraint = "visuals_constraint"+constraint_num;
        var audio_constraint = "audio_constraint"+constraint_num;

        // Use jcanvas to draw the constraint
        $('#retimer_constraints').drawLine({
                layer: true,
                name: arrow_name,
                strokeStyle: color,
                strokeWidth: 4,
                rounded: true,
                x1: xVal, y1: 185,
                x2: xVal, y2: 15
            })
            .drawArc({
                layer: true,
                name: visuals_constraint,
                draggable: true,
                fillStyle: color,
                x: xVal, y: 15,
                radius: 10,
                drag: function(layer){
                    constraintDrag(visuals_constraint, audio_constraint, 15, arrow_name)
                },
                dragstop: function(layer){
                    updateVisualConstraint(constraint_num, visuals_constraint, audio_constraint, arrow_name);
                }
            })
            .drawArc({
                layer: true,
                name: audio_constraint,
                draggable: true,
                fillStyle: color,
                x: xVal, y: 185,
                radius: 10,
                drag: function(layer) {
                    constraintDrag(audio_constraint, visuals_constraint, 185, arrow_name);
                },
                dragstop: function(layer){
                    updateAudioConstraint(constraint_num, audio_constraint, visuals_constraint, arrow_name);
                }
            });
        // Draw the constraint (using jcanvas)
        $('#retimer_constraints').drawLayers();
    }

    // When a user adds a constraint, add the constraint to the lecture
    // xVal: position where the constraint was added to the canvas
    // TODO: figure out if this is working properly with the interpolation (possible with getting the visual from audio)
    function addConstraintToLec(xVal){
        console.log("adding!");

        // FORUMULAS
        // interp_factor = (curr_time-prev_time)/(next_time-prevX)
        // constraint_tVis = (next_time-prev_time)*interp_factor + prev_tVis
        // constraint_tAud = (next_time-prev_time)*interp_factor + prev_tAud

        // Make sure to convert this from the lecture duration to audio duration
        var audio_scale = pentimento.lectureController.getLectureDuration()/$('#retimer_constraints').width();
        console.log("scale: " + audio_scale);
        var tAud = xVal * audio_scale;
        console.log("taud: " + tAud);
        var tVis = retimerModel.getVisualTime(tAud);
        console.log("tvis: " + tVis);
        // var prev_const = window.opener.retimerModel.getPreviousConstraint(curr_audio_time, "Audio");
        // var next_const = window.opener.retimerModel.getNextConstraint(curr_audio_time, "Audio");
        // var prevTime = prev_const.getTVisual();
        // var nextTime = next_const.getTVisual();
        // console.log(nextTime);
        // var prevX = 0;
        // var nextX = $('#retimer_constraints').width();
        // console.log(nextX);
        // var interp = (nextTime-prevTime)/(nextX-prevX);
        // console.log("interp: " + interp);
        // var tVis = interp*xVal;
        // var tAud = interp*xVal;
        var constraint = new Constraint(tVis, tAud, ConstraintTypes.Manual);
        retimerModel.addConstraint(constraint);
    }

    // When a user drags the visuals end of a constraint the constraint will need to be updated
    // visual_name: the ID of the visual end of the constraint
    // audio_name: the ID of the audio end of the constraint
    function updateVisualConstraint(constraint_num, visual_name, audio_name, arrow_name){
        console.log("dragged to: " + $('#retimer_constraints').getLayer(visual_name).x);
        console.log("anchor at: " + $('#retimer_constraints').getLayer(audio_name).x);

        // Figure out what the scale is in terms of the lecture position 
        var audio_scale = pentimento.lectureController.getLectureDuration()/$('#retimer_constraints').width();

        // Get the audio time from the position of the audio end of the constraint times the audio scales
        var tAud = $('#retimer_constraints').getLayer(audio_name).x * audio_scale;
        // var oldtVis = window.opener.retimerModel.getVisualTime(tAud);
        // console.log("oldtVis: " + oldtVis);

        // Get the previous constraint and the next constraint
        // TODO: do this from the retimer controller and not from here...
        var prev_const = getPreviousConstraint(tAud, "Audio");
        var next_const = getNextConstraint(tAud, "Audio");

        // Get the visual time from the previous and next constraint
        var prevTVis = prev_const.getTVisual();
        var nextTVis = next_const.getTVisual();

        // Get the new visual constraint position where the user stops dragging the constraint
        var newVisXVal = $('#retimer_constraints').getLayer(visual_name).x;
        // Calculate the time of the new visual position in the global (audio) scale
        var draggedTAud = newVisXVal * audio_scale;
        // Get the new visul time (in terms of the new audio time)
        var newTVis = retimerModel.getVisualTime(draggedTAud);
        console.log("newTVis: " + newTVis);
        
        // Get the constraints to iterate over
        var constraints = retimerModel.getConstraintsIterator();

        // TODO: why do I have the oldTVis??
        var oldTVis;
        // Iterate through the constraints until the audio time matches the audio time of a constraint
        // (since audio was not moved that will be the constraint to update)
        while(constraints.hasNext()){
            var constraint = constraints.next();
            var currTAud = constraint.getTAudio();
            console.log("currAudio: " + currTAud);

            // Once the audio time of the current constraint = the audio time of the dragged constraint reset
            // the visual time of that specific constraint
            if(currTAud == tAud){
                console.log("SETTING!");
                constraint.setTVisual(newTVis);
                break;
            }
        }

        // Redraw the thumbnails to correspond to the new visual timing
        var numThumbs = $('#thumbnails_div').children().length;
        console.log("NUMBER TO DRAW: " + numThumbs);
        var audioThumbTime = 1000; // ms per thumbnail in global/audio time.
        redrawThumbnails(numThumbs, audioThumbTime);

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraintsCanvas();

    }

    // TODO: actually test this with audio stuff
    // When a user drags the audio end of a constraint the audio time of that constraint must be updated
    // visual_name: the ID of the visual end of the constraint
    // audio_name: the ID of the audio end of the constraint
    function updateAudioConstraint(constraint_num, audio_name, visual_name, arrow_name){
        // Calculate the scale to convert from position of the audio end of the constraint to audio time
        var audio_scale = pentimento.lectureController.getLectureDuration()/$('#retimer_constraints').width();
        // Get the visual time of the constraint in audio time
        var tVis = $('#retimer_constraints').getLayer(visual_name).x * audio_scale;
        // Get the new audio time where the user stopped dragging the audio constraint
        var newTAud = $('#retimer_constraints').getLayer(audio_name).x * audio_scale;

        // Get the constraints to iterate over
        var constraints = retimerModel.getConstraintsIterator();

        // Itereate over the constraints until the constraint with the visual time matching the visual time of the
        // dragged constraint is located and update audio time to match the new audio time
        // TODO: redraw thumbnails??
        while(constraints.hasNext()){
            var constraint = constraints.next();
            var currTVis = constraint.getTVisual();
            console.log("currVis: " + currTVis);

            // Once the visual time of the current constraint = the visual time of the dragged constraint reset
            // the audio time of that specific constraint
            if(currTVis == tVis){
                console.log("SETTING!");
                constraint.setTAudio(newTAud);
                break;
            }
        }
        
        // Redraw the thumbnails to correspond to the new visual timing
        var numThumbs = $('#thumbnails_div').children().length;
        console.log("NUMBER TO DRAW: " + numThumbs);
        var audioThumbTime = 1000; // ms per thumbnail in global/audio time.
        redrawThumbnails(numThumbs, audioThumbTime);

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraintsCanvas();
    }

};
