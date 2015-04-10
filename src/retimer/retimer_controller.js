/* TODO:
    1) Make sure that global time/audio time is used in all appropriate places instead of visual time
        1a) figure out where it is appropriate to use visual time (i.e. if there is no audio recording)
    2) Make this into a controller...
*/
"use strict";

var RetimerController = function(retimer_model, visuals_controller, audio_controller) {

    var retimerModel = retimer_model;
    var audioController = audio_controller;
    var thumbnailsController = new ThumbnailsController(visuals_controller, audio_controller);


    ///////////////////////////////////////////////////////////////////////////////
    // DOM Elements
    ///////////////////////////////////////////////////////////////////////////////

    var constraintsDivID = null;  // Set by the audio timeline plugin function setViewID()
    var constraintsHeight = 80;  // height of the constraints div and canvas in pixels
    var constraintsCanvasID = 'constraints';
    var constraintHandleRadius = 10;  // Radius of the circular handle at both ends of the constraint


    ///////////////////////////////////////////////////////////////////////////////
    // Draw Methods
    ///////////////////////////////////////////////////////////////////////////////

    // The event handler function for when a user clicks on the constraints canvas.
    // It adds the constraint to the model, and then
    var addArrowHandler = function(event) {
        var canvas = $('#'+constraintsCanvasID);

        // See where the user clicked to add the constraint
        var x = event.pageX;
        var y = event.pageY;
        x -= canvas.offset().left;
        y -= canvas.offset().top;

        // Add the constraint tothe lecture (at the time calculated by the position on the constraints canvas)
        addConstraint(audioController.pixelsToMilliseconds(x));

        // Refresh canvas
        redrawConstraints();

        // Unbind the click event from the constraints canvas (so that clicking can be used for other functions)
        canvas.unbind('mousedown', addArrowHandler);    
    };

    // Draw the constraint on the constraints canvas (for manual/user added constraints)
    // constraint_num: unique id for each constraint added (incremented by the retimer)
    var drawConstraint = function(constraint_num) {
        $('#'+constraintsCanvasID).on('mousedown', addArrowHandler);
    };

    // How dragging the constraints works
    // drag_name: either audio_constraint or visuals_constraint depending on which is being dragged
    // anchor_name: the end ofthe constraints staying anchored (audio_constraint or visuals_constraint, whichever is not being dragged)
    // yVal: the y coordinate of the constraint being dragged (So it is dragged along a fixed line)
    // arrow_id: unique ID associated with the constraint 
    var constraintDrag = function(drag_name, anchor_name, yVal, arrow_id){
        // Use jcanvas to drag the appropriate arrow (changing the x value)
        $('#'+constraintsCanvasID).setLayer(drag_name,{                     
            x: $('#'+constraintsCanvasID).getLayer(drag_name).x , y: yVal,
        })

        // Reset the constraint paramaters as it is being dragged
        $('#'+constraintsCanvasID).setLayer(arrow_id,{                   
            x1: $('#'+constraintsCanvasID).getLayer(anchor_name).x , y1: $('#'+constraintsCanvasID).getLayer(anchor_name).y,
            x2: $('#'+constraintsCanvasID).getLayer(drag_name).x , y2: yVal
        })
    }

    // Refresh the canvas and redraw the constraints
    var redrawConstraints = function() {
        console.log("REDRAWING??");
        if (!constraintsDivID) {
            console.log('constraints div has not been set');
        };

        // Clear the plugin div
        $('#'+constraintsDivID).html('');
        // $('#'+constraintsCanvasID).clearCanvas();

        // Calculate the width of the canvas based on the total lecture duration
        var max_time = pentimento.lectureController.getLectureModel().getLectureDuration();
        var new_width = audioController.millisecondsToPixels(max_time);

        // Create and add the new canvas 
        var newCanvas = $('<canvas></canvas>');
        newCanvas.attr('id', constraintsCanvasID);
        newCanvas.css('width', new_width)
                .css('height', constraintsHeight);
        $('#'+constraintsDivID).append(newCanvas);

        // Get all of the constraints currently added to the lecture
        var constraints = retimerModel.getConstraintsIterator();

        // Reset the ID of constraints to 0
        var constraint_num = 0;

        // Iterate through the constraints and redraw each one
        while(constraints.hasNext()){
            var constraint = constraints.next();

            // Redraw the constraint
            redrawConstraint(constraint, constraint_num);

            // Increment the ID number
            constraint_num += 1;
        };

        // Draw the constraint (using jcanvas)
        $('#'+constraintsCanvasID).drawLayers();
    };

    // Redraw an individual constraint
    // constraint_num: unique ID for the constraint
    var redrawConstraint = function(constraint, constraint_num) {

        // Get the audio time of the constraints and convert it to the position where to draw the constraint
        var tAud = constraint.getTAudio();
        var xVal = audioController.millisecondsToPixels(tAud);

        // If the constraint was manually drawn it should be black, if it was automatic it should be gray
        var type = constraint.getType();
        var color;
        if (type == 'Automatic') {
            color = '#BDBDBD';
        } else if (type == 'Manual') {
            color = '#000';
        } else {
            console.error("invalid constraint type: " + type);
        };

        // Set the ID for the constraint
        var arrow_name = "arrow_"+constraint_num;
        var visuals_constraint = "visuals_constraint"+constraint_num;
        var audio_constraint = "audio_constraint"+constraint_num;

        // Use jcanvas to draw the constraint
        $('#'+constraintsCanvasID).drawLine({
                layer: true,
                name: arrow_name,
                bringToFront: true,
                strokeStyle: color,
                strokeWidth: 4,
                rounded: true,
                x1: xVal, y1: constraintsHeight - constraintHandleRadius,
                x2: xVal, y2: constraintHandleRadius
            })
            .drawArc({  // top handle
                layer: true,
                name: visuals_constraint,
                bringToFront: true,
                draggable: true,
                fillStyle: color,
                x: xVal, y: constraintHandleRadius,
                radius: constraintHandleRadius,
                drag: function(layer){
                    constraintDrag(visuals_constraint, audio_constraint, 10, arrow_name)
                },
                dragstop: function(layer){
                    updateVisualConstraint(constraint_num, visuals_constraint, audio_constraint, arrow_name);
                }
            })
            .drawArc({  // bottom handle
                layer: true,
                name: audio_constraint,
                bringToFront: true,
                draggable: true,
                fillStyle: color,
                x: xVal, y: constraintsHeight - constraintHandleRadius,
                radius: constraintHandleRadius,
                drag: function(layer) {
                    constraintDrag(audio_constraint, visuals_constraint, constraintsHeight-10, arrow_name);
                },
                dragstop: function(layer){
                    updateAudioConstraint(constraint_num, audio_constraint, visuals_constraint, arrow_name);
                }
            });
    };

    // When a user adds a constraint, add the constraint to the lecture
    // xVal: position where the constraint was added to the canvas
    // TODO: figure out if this is working properly with the interpolation (possible with getting the visual from audio)
    var addConstraint = function(audio_time){

        // Convert to visual time
        console.log("taud: " + audio_time);
        var visual_time = retimerModel.getVisualTime(audio_time);
        console.log("tvis: " + visual_time);

        // Add a constraint to the model
        var constraint = new Constraint(visual_time, audio_time, ConstraintTypes.Manual);
        retimerModel.addConstraint(constraint);

        // Refresh the view
        // TODO
    }

    // When a user drags the visuals end of a constraint the constraint will need to be updated
    // visual_name: the ID of the visual end of the constraint
    // audio_name: the ID of the audio end of the constraint
    var updateVisualConstraint = function(constraint_num, visual_name, audio_name, arrow_name){
        console.log("dragged to: " + $('#'+constraintsCanvasID).getLayer(visual_name).x);
        console.log("anchor at: " + $('#'+constraintsCanvasID).getLayer(audio_name).x);

        // Figure out what the scale is in terms of the lecture position 
        var audio_scale = pentimento.lectureController.getLectureModel().getLectureDuration()/$('#'+constraintsCanvasID).width();

        // Get the audio time from the position of the audio end of the constraint times the audio scales
        var tAud = $('#'+constraintsCanvasID).getLayer(audio_name).x * audio_scale;
        // var oldtVis = window.opener.retimerModel.getVisualTime(tAud);
        // console.log("oldtVis: " + oldtVis);

        // Get the previous constraint and the next constraint
        var prev_const = retimerModel.getPreviousConstraint(tAud, "Audio");
        var next_const = retimerModel.getNextConstraint(tAud, "Audio");

        // Get the visual time from the previous and next constraint
        var prevTVis = prev_const.getTVisual();
        var nextTVis = next_const.getTVisual();

        // Get the new visual constraint position where the user stops dragging the constraint
        var newVisXVal = $('#'+constraintsCanvasID).getLayer(visual_name).x;
        // Calculate the time of the new visual position in the global (audio) scale
        var draggedTAud = newVisXVal * audio_scale;
        // Get the new visul time (in terms of the new audio time)
        var newTVis = retimerModel.getVisualTime(draggedTAud);
        console.log("newTVis: " + newTVis);
        
        // Get the constraints to iterate over
        var constraints = retimerModel.getConstraintsIterator();

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
        thumbnailsController.drawThumbnails();

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraints();
    };

    // TODO: actually test this with audio stuff
    // When a user drags the audio end of a constraint the audio time of that constraint must be updated
    // visual_name: the ID of the visual end of the constraint
    // audio_name: the ID of the audio end of the constraint
    var updateAudioConstraint = function(constraint_num, audio_name, visual_name, arrow_name){
        // Calculate the scale to convert from position of the audio end of the constraint to audio time
        var audio_scale = pentimento.lectureController.getLectureModel().getLectureDuration()/$('#'+constraintsCanvasID).width();
        // Get the visual time of the constraint in audio time
        var tVis = $('#'+constraintsCanvasID).getLayer(visual_name).x * audio_scale;
        // Get the new audio time where the user stopped dragging the audio constraint
        var newTAud = $('#'+constraintsCanvasID).getLayer(audio_name).x * audio_scale;

        // Itereate over the constraints until the constraint with the visual time matching the visual time of the
        // dragged constraint is located and update audio time to match the new audio time
        var constraints = retimerModel.getConstraintsIterator();
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
        thumbnailsController.drawThumbnails();

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraints();
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // Button click handlers
    ///////////////////////////////////////////////////////////////////////////////

    // TODO register the click handler
    var constraint_index = 0;
    $('#sync').click(function() {
        console.log('hi')
        drawConstraint(constraint_index);
        constraint_index++;
    });

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // Creates the plugin to display on the audio timeline and registers callbacks
    // to the time controller. 
    // The constraints are drawn whenever the audio timeline is (re)drawn and zoomed, 
    // and they are also drawn when a recording ends.
    ///////////////////////////////////////////////////////////////////////////////

    // Adds a plugin to the audio controller so that it can display a view inside the audio timeline
    audioController.addTimelinePlugin({
        name: 'Constraints',
        height: constraintsHeight, 
        setViewID: function(pluginDivID) { constraintsDivID = pluginDivID; },
        draw: redrawConstraints, 
        zoom: redrawConstraints
    });

    pentimento.timeController.addEndRecordingCallback(function(currentTime) {
        redrawConstraints();
    });
    pentimento.timeController.addBeginRecordingCallback(function(currentTime) {
        var constraint = new Constraint(currentTime, currentTime, ConstraintTypes.Automatic);
        retimerModel.addConstraint(constraint);
    });
    pentimento.timeController.addEndRecordingCallback(function(currentTime) {
        var constraint = new Constraint(currentTime, currentTime, ConstraintTypes.Automatic);
        retimerModel.addConstraint(constraint);
    });
};
