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

    // Constraint dragging
    var isDragTop;  // boolean indicating whether the top or bottom is being dragged
    var originalDragX;  // integer indicating the original x position of the dragged constraint


    ///////////////////////////////////////////////////////////////////////////////
    // DOM Elements
    ///////////////////////////////////////////////////////////////////////////////

    var constraintsDivID = null;  // Set by the audio timeline plugin function setViewID()
    var constraintsHeight = 80;  // height of the constraints div and canvas in pixels
    var constraintsCanvasID = 'constraints';
    var constraintHandleRadius = 10;  // Radius of the circular handle at both ends of the constraint

    // Buttons
    var addConstraintButtonID = 'sync';

    // Canvas IDs
    var constraintIDBase = 'constraint_';


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

        // Use jcanvas to draw the constraint
        // The constraint consists of a top and bottom arrow for the visuals and audio constraints, respectively.
        $('#'+constraintsCanvasID)
            .drawLine({  // top handle
                layer: true,
                name: constraintIDBase + constraint_num,
                bringToFront: true,
                draggable: true,
                strokeStyle: color,
                strokeWidth: 4,
                rounded: true,
                startArrow: true,
                endArrow: true,
                arrowRadius: constraintHandleRadius,
                arrowAngle: 90,
                x1: xVal, y1: constraintHandleRadius,
                x2: xVal, y2: constraintsHeight - constraintHandleRadius,
                dragstart: constraintDragStart,
                drag: constraintDrag,
                dragstop: constraintDragStop,
                dragcancel: constraintDragCancel
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

        // Refresh the view if the adding succeeded
        if (result) {
            redrawConstraints();
        };
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Constraint Drag Handling
    ///////////////////////////////////////////////////////////////////////////////

    // When dragging starts, record whether the drag is for the top or bottom arrow
    // and record the original x position of the arrow
    var constraintDragStart = function(layer) {
        isDragTop = (layer.eventY < (constraintsHeight / 2));
        originalDragX = layer.x1;  // use the arrow's x1, not layer.x
    };

    // Dragging moves one of the arrow while the other tip remains in place
    var constraintDrag = function(layer) {

        // The x-position of the non-drag tip of the arrow shouldn't change, and the dragged tip of the arrow moves with the drag.
        // The position of the dragged end is calculated with the layer x-position as the offset from the original x-position.
        // x1 is the visuals end (top) and x2 is the audio end (bottom).
        var x1;
        var x2;
        if (isDragTop) {
            x1 = originalDragX + layer.x;
            x2 = originalDragX;
        } else {
            x1 = originalDragX;
            x2 = originalDragX + layer.x;
        };

        // The y-position of the constraint should not change as it is dragged.
        // y1 is the visuals end (top) and y2 is the audio end (bottom).
        var y1 = constraintHandleRadius;
        var y2 = constraintsHeight - constraintHandleRadius;

        // Update the layer
        $('#'+constraintsCanvasID).setLayer(layer, {
            x: 0, y: 0,  // x, y are the layer coordinates, which should remain fixed at the origin
            x1: x1, y1: y1,
            x2: x2, y2: y2
        });
    };

    // When dragging stops, update the visuals or audio depending on whether the drag is top or bottom
    var constraintDragStop = function(layer) {
        var visusalsXVal = layer.x1;
        var audioXVal = layer.x2;

        // Update audio or visuals depending on top or bottom
        if (isDragTop) {  // visuals

            // Get the audio time from the position
            var tAud = audioController.pixelsToMilliseconds(audioXVal);
            var draggedTAud = audioController.pixelsToMilliseconds(visusalsXVal);

            // Update the visual part of the constraint in the model
            retimerModel.updateConstraintVisualsTime(tAud, draggedTAud);

        } else {  // audio

            // Get the audio time from the position
            var tVis = audioController.pixelsToMilliseconds(visusalsXVal);
            var newTAud = audioController.pixelsToMilliseconds(audioXVal);

            // Update the audio part of the constraint in the model
            retimerModel.updateConstraintAudioTime(tVis, newTAud);
        };

        // Redraw the thumbnails to correspond to the new visual timing
        thumbnailsController.drawThumbnails();

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraints();
    };

    // When dragging cancels (drag off the canvas), it should reset to its original value
    var constraintDragCancel = function(layer) {
        layer.x = 0;
        layer.x1 = originalDragX;
        layer.x2 = originalDragX;
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
