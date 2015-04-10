/* TODO:
    1) Make sure that global time/audio time is used in all appropriate places instead of visual time
        1a) figure out where it is appropriate to use visual time (i.e. if there is no audio recording)
    2) Make this into a controller...
*/
"use strict";

var RetimerController = function(retimer_model, visuals_controller, audio_controller) {

    var retimerModel = retimer_model;
    var audioController = audio_controller;
    var thumbnailsController = new ThumbnailsController(visuals_controller, audio_controller, retimer_model);


    ///////////////////////////////////////////////////////////////////////////////
    // DOM Elements
    ///////////////////////////////////////////////////////////////////////////////

    var constraintsDivID = null;  // Set by the audio timeline plugin function setViewID()
    var constraintsHeight = 80;  // height of the constraints div and canvas in pixels
    var constraintsCanvasID = 'constraints';
    var constraintHandleRadius = 10;  // Radius of the circular handle at both ends of the constraint

    // Buttons
    var addConstraintButtonID = 'sync';


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
        console.log(x + ", " + y);

        // Add the constraint to the model and refresh the view
        addConstraint(audioController.pixelsToMilliseconds(x), ConstraintTypes.Manual);

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
    // anchor_name: the end of the constraints staying anchored (audio_constraint or visuals_constraint, whichever is not being dragged)
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
        // The size of the jcanvas must be set using attributes, not CSS.
        var newCanvas = $('<canvas></canvas>');
        newCanvas.attr('id', constraintsCanvasID)
                .attr('width', new_width)
                .attr('height', constraintsHeight);
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
        if (type === ConstraintTypes.Automatic) {
            color = '#BDBDBD';
        } else if (type === ConstraintTypes.Manual) {
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
                    constraintDrag(visuals_constraint, audio_constraint, constraintHandleRadius, arrow_name)
                },
                dragstop: function(layer){
                    updateVisualConstraint(constraint_num, visuals_constraint, audio_constraint, arrow_name);
                }, 
                dragcancel: function(layer) {
                    // When dragging off the canvas, it should reset to its original value to cancel
                    layer.x = xVal;  // know
                    $('#'+constraintsCanvasID).getLayer(arrow_name).x1 = xVal; // arrow
                    $('#'+constraintsCanvasID).getLayer(arrow_name).x2 = xVal; // arrow
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
                    constraintDrag(audio_constraint, visuals_constraint, constraintsHeight-constraintHandleRadius, arrow_name);
                },
                dragstop: function(layer){
                    updateAudioConstraint(constraint_num, audio_constraint, visuals_constraint, arrow_name);
                }, 
                dragcancel: function(layer){
                    // When dragging off the canvas, it should reset to its original value to cancel
                    layer.x = xVal;  // knob
                    $('#'+constraintsCanvasID).getLayer(arrow_name).x1 = xVal; // arrow
                    $('#'+constraintsCanvasID).getLayer(arrow_name).x2 = xVal; // arrow
                }
            });
    };

    // When a user adds a constraint, add the constraint to the lecture
    // xVal: position where the constraint was added to the canvas
    // TODO: figure out if this is working properly with the interpolation (possible with getting the visual from audio)
    var addConstraint = function(audio_time, constraint_type){

        // Convert to visual time
        var visual_time = retimerModel.getVisualTime(audio_time);

        // Add a constraint to the model
        var constraint = new Constraint(visual_time, audio_time, constraint_type);
        var result = retimerModel.addConstraint(constraint);

        // Refresh the view
        if (result) {
            redrawConstraints();
        } else {
            console.error("Invalid constraint");
            console.error(constraint);
        };
    }

    // When a user drags the visuals end of a constraint the constraint will need to be updated
    // visual_name: the ID of the visual end of the constraint
    // audio_name: the ID of the audio end of the constraint
    var updateVisualConstraint = function(constraint_num, visual_name, audio_name, arrow_name){

        var visusalsXVal = $('#'+constraintsCanvasID).getLayer(visual_name).x;
        var audioXVal = $('#'+constraintsCanvasID).getLayer(audio_name).x;

        // Get the audio time from the position
        var tAud = audioController.pixelsToMilliseconds(audioXVal);
        var draggedTAud = audioController.pixelsToMilliseconds(visusalsXVal);

        // Update the visual part of the constraint in the model
        retimerModel.updateConstraintVisualsTime(tAud, draggedTAud);

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

        var visusalsXVal = $('#'+constraintsCanvasID).getLayer(visual_name).x;
        var audioXVal = $('#'+constraintsCanvasID).getLayer(audio_name).x;

        // Get the audio time from the position
        var tVis = audioController.pixelsToMilliseconds(visusalsXVal);
        var newTAud = audioController.pixelsToMilliseconds(audioXVal);

        retimerModel.updateConstraintAudioTime(tVis, newTAud);
        
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
    $('#'+addConstraintButtonID).click(function() {
        drawConstraint();
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

    pentimento.timeController.addBeginRecordingCallback(function(currentTime) {
        addConstraint(currentTime, ConstraintTypes.Automatic);
    });
    pentimento.timeController.addEndRecordingCallback(function(currentTime) {
        addConstraint(currentTime, ConstraintTypes.Automatic);
    });
};
