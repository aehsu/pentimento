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

    // Selection dragging
    var selectionX;
    var selectionY;
    var selectedConstraints = [];

    // Constraint dragging
    var isDragTop;  // boolean indicating whether the top or bottom is being dragged
    var originalDragX;  // integer indicating the original x position of the dragged constraint
    var lastValidDragX;  // integer indicating the last valid x position of the dragged constraint

    ///////////////////////////////////////////////////////////////////////////////
    // DOM Elements
    ///////////////////////////////////////////////////////////////////////////////

    var constraintsDivID = null;  // Set by the audio timeline plugin function setViewID()
    var constraintsHeight = 80;  // height of the constraints div and canvas in pixels
    var constraintsCanvasID = 'constraints';
    var constraintHandleRadius = 10;  // Radius of the circular handle at both ends of the constraint

    // Buttons
    var addConstraintButtonID = 'sync';
    var deleteConstraintButtonID = 'delete_sync';

    // Canvas IDs
    var constraintIDBase = 'constraint_';

    // Insertion begin time (-1 indictes no insertion is occurring)
    var insertionStartTime = -1;

    ///////////////////////////////////////////////////////////////////////////////
    // Selection/Deletion handling
    ///////////////////////////////////////////////////////////////////////////////
    var selectArea = function(event){
        console.log("SELECTING");
        selectedConstraints = [];

        var canvas = $('#'+constraintsCanvasID);

        canvas.removeLayer("selectedArea");

        var x = event.pageX;
        var y = event.pageY;
        x -= canvas.offset().left;
        y -= canvas.offset().top;

        selectionX = x;
        selectionY = y;

        canvas.drawPath({
            layer: true,
            name: "selectedArea",
            bringToFront: true,
            strokeStyle: '#000',
            strokeWidth: 2,
            strokeDash: [5,3],
            opacity: 0.25,
            fillStyle: 'blue',
            closed: true,
            dragging: true,
            p1: {
                type: 'line',
                x1: x, y1: y,
                x2: x, y2: y,
                x3: x, y3: y,
                x4: x, y4: y,
            }
        });

        canvas.on('mousemove', selectionDrag);
        canvas.on('mouseup', endSelect);
    }

    var selectionDrag = function(event){
        var canvas = $('#'+constraintsCanvasID);

        var x = event.pageX;
        var y = event.pageY;
        x -= canvas.offset().left;
        y -= canvas.offset().top;


        canvas.setLayer("selectedArea", {
            x: 0, y: 0,  // x, y are the layer coordinates, which should remain fixed at the origin
            p1: {
                type: 'line',
                x1: selectionX, y1: selectionY,
                x2: x, y2: selectionY,
                x3: x, y3: y,
                x4: selectionX, y4: y
            }
        });
    }

    var endSelect = function(event){
        var canvas = $('#' + constraintsCanvasID);
        canvas.unbind('mousemove', selectionDrag);
        selectConstraints();
    };

    var selectConstraints = function(event){
        var canvas = $('#'+constraintsCanvasID);
        var x1 = canvas.getLayer('selectedArea').p1.x1;
        var x2 = canvas.getLayer('selectedArea').p1.x2;

        var constraints = retimerModel.getConstraintsIterator();

        var constraint_num = 0;
        var constraintLayer = constraintIDBase + constraint_num;

        // Iterate through the constraints
        while(constraints.hasNext()){
            var constraint = constraints.next();
            var tAud = constraint.getTAudio();
            var xAud = audioController.millisecondsToPixels(tAud);
            if (xAud > x1 && xAud < x2){
                constraintLayer = constraintIDBase + constraint_num
                selectedConstraints.push({layer: constraintLayer, constraint: constraint});
            }
            constraint_num ++;
        };

        canvas.removeLayer('selectedArea');
        displaySelectedConstraints();
        
    }

    var displaySelectedConstraints = function(event){
        var canvas = $('#'+constraintsCanvasID);
        var layer;
        for(var i =0; i < selectedConstraints.length; i++){
            layer = selectedConstraints[i].layer;
            canvas.setLayer(layer, {
                strokeStyle: 'red'
            });
        }
        canvas.drawLayers();
    }

    var deleteConstraints = function(event){
        var canvas = $('#'+constraintsCanvasID);
        var layer;
        var constraint;
        for(var i =0; i < selectedConstraints.length; i++){
            layer = selectedConstraints[i].layer;
            constraint = selectedConstraints[i].constraint;
            retimerModel.deleteConstraint(constraint);
            canvas.removeLayer(layer);
        }
        canvas.drawLayers();
    }



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

        // Add the constraint to the model and refresh the view
        addConstraint(audioController.pixelsToMilliseconds(x), ConstraintTypes.Manual);

        // Unbind the click event from the constraints canvas (so that clicking can be used for other functions)
        canvas.unbind('mousedown', addArrowHandler);    
        canvas.unbind('mousedown', selectArea);
    };

    // Draw the constraint on the constraints canvas (for manual/user added constraints)
    // constraint_num: unique id for each constraint added (incremented by the retimer)
    var drawConstraint = function(constraint_num) {
        $('#'+constraintsCanvasID).unbind('mousedown', selectArea);
        // $('#'+constraintsCanvasID).unbind('mousemove', selectionDrag);
        $('#'+constraintsCanvasID).on('mousedown', addArrowHandler);
    };

    // Refresh the canvas and redraw the constraints
    var redrawConstraints = function() {
        if (!constraintsDivID) {
            console.log('constraints div has not been set');
        };

        // Clear the plugin div
        $('#'+constraintsDivID).html('');
        // $('#'+constraintsCanvasID).clearCanvas();

        // Calculate the width of the canvas based on the total lecture duration
        var max_time = lectureController.getLectureModel().getLectureDuration();
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
        $('#'+constraintsCanvasID).on('mousedown', selectArea);
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

        var visuals_constraint = "visuals_constraint" + constraint_num;
        var audio_constraint= "audio_constraint" + constraint_num

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

            // .drawBezier({  // top handle
            //     layer: true,
            //     name: constraintIDBase + constraint_num,
            //     bringToFront: true,
            //     draggable: true,
            //     strokeStyle: color,
            //     strokeWidth: 4,
            //     rounded: true,
            //     startArrow: true,
            //     endArrow: true,
            //     arrowRadius: constraintHandleRadius,
            //     arrowAngle: 90,
            //     x1: xVal, y1: constraintHandleRadius,
            //     cx1: xVal, cy1: constraintsHeight/4,
            //     cx2: xVal, cy2: constraintsHeight/4,
            //     x2: xVal, y2: constraintsHeight - constraintHandleRadius,
            //     dragstart: constraintDragStart,
            //     drag: constraintDrag,
            //     dragstop: constraintDragStop,
            //     dragcancel: constraintDragCancel
            // });
    };

    // When a user adds a constraint, add the constraint to the lecture
    // TODO: figure out if this is working properly with the interpolation (possible with getting the visual from audio)
    var addConstraint = function(audio_time, constraint_type) {

        // Convert to visual time
        var visual_time = retimerModel.getVisualTime(audio_time);

        // Add a constraint to the model
        var constraint = new Constraint(visual_time, audio_time, constraint_type);
        console.log('new constraint')
        console.log('visual: ' + visual_time)
        console.log('audio: ' + audio_time)
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
        $('#' + constraintsCanvasID).unbind('mousedown', selectArea);
        $('#' + constraintsCanvasID).unbind('mousemove', selectionDrag);
        isDragTop = (layer.eventY < (constraintsHeight / 2));
        originalDragX = layer.x1;  // use the arrow's x1, not layer.x
        lastValidDragX = originalDragX;
    };

    // Dragging moves one of the arrow while the other tip remains in place
    var constraintDrag = function(layer) {

        // Get the constraint
        var index = layer.name.split(constraintIDBase)[1];
        var constraint = retimerModel.getConstraints()[index];

        // The x-position of the non-drag tip of the arrow shouldn't change, and the dragged tip of the arrow moves with the drag.
        // The position of the dragged end is calculated with the layer x-position as the offset from the original x-position.
        var fixedX = originalDragX;
        var draggedX = originalDragX + layer.x;

        // Get the audio time from the position
        var newTAud = audioController.pixelsToMilliseconds(draggedX);

        // Test update audio or visuals depending on top or bottom
        var isValid;
        var isTest = true;
        if (isDragTop) {  // visuals
            // Update the visual part of the constraint in the model
            isValid = retimerModel.updateConstraintVisualsTime(constraint, newTAud, isTest);

        } else {  // audio
            // Update the audio part of the constraint in the model
            isValid = retimerModel.updateConstraintAudioTime(constraint, newTAud, isTest);
        };


        // If the drag is valid, save the current dragged x position as the last valid x position
        // Else the drag is invalid, and set the dragged x position to the last valid position instead.
        console.log('isValid: ' + isValid)
        if (isValid) {
            lastValidDragX = draggedX;
        } else {
            draggedX = lastValidDragX;
        };

        // Set the x1 and x2 positions.
        // x1 is the end that is dragged for the visuals (top) and x2 for audio end (bottom).
        var x1;
        var x2;
        if (isDragTop) {  // visuals
            x1 = draggedX;
            x2 = fixedX;
        } else {  // audio
            x1 = fixedX;
            x2 = draggedX;
        };

        // Set the y1 and y2 positions.
        // The y-position of the constraint should not change as it is dragged.
        // y1 is the visuals end (top) and y2 is the audio end (bottom).
        var y1 = constraintHandleRadius;
        var y2 = constraintsHeight - constraintHandleRadius;

        // Update the layer with the new position values
        $('#'+constraintsCanvasID).setLayer(layer, {
            x: 0, y: 0,  // x, y are the layer coordinates, which should remain fixed at the origin
            x1: x1, y1: y1,
            x2: x2, y2: y2
        });
    };

    // When dragging stops, update the visuals or audio depending on whether the drag is top or bottom
    var constraintDragStop = function(layer) {

        // Get the constraint
        var index = layer.name.split(constraintIDBase)[1];
        var constraint = retimerModel.getConstraints()[index];

        // The visuals and audio constraint x values come from x1 and x2
        // layer.x can't be used because it gets set to 0 at the end of every drag.
        var visusalsXVal = layer.x1;
        var audioXVal = layer.x2;

        // Update audio or visuals depending on top or bottom
        var isValid;
        if (isDragTop) {  // visuals

            // Get the audio time from the position
            var draggedTAud = audioController.pixelsToMilliseconds(visusalsXVal);

            // Update the visual part of the constraint in the model
            isValid = retimerModel.updateConstraintVisualsTime(constraint, draggedTAud);

        } else {  // audio

            // Get the audio time from the position
            var newTAud = audioController.pixelsToMilliseconds(audioXVal);

            // Update the audio part of the constraint in the model
            isValid = retimerModel.updateConstraintAudioTime(constraint, newTAud);
        };

        // If the update is not valid, then it is an error because the checking in constraintDrag()
        // should make sure we never end up in an invalid position
        if (!isValid) {
            console.error('constraint update drag is not valid');
        };

        // Redraw the thumbnails to correspond to the new visual timing
        thumbnailsController.drawThumbnails();

        // Redraw the constraints to snap into place (redraw the whole canvas)
        redrawConstraints();

        // $('#' + constraintsCanvasID).on('mousedown', selectArea);
    };

    // When dragging cancels (drag off the canvas), it should reset to its original value
    var constraintDragCancel = function(layer) {
        layer.x = 0;
        layer.x1 = originalDragX;
        layer.x2 = originalDragX;
        // $('#' + constraintsCanvasID).on('mousedown', selectArea);
    };

    // Dealing with insertions
    var insertionShifting = function(insertionEndTime){
        var insertionDuration = insertionEndTime - insertionStartTime;

        var constraintsToShift = [];

        var constraints = retimerModel.getConstraintsIterator();

        // Iterate through the constraints and shift them
        while(constraints.hasNext()){
            var constraint = constraints.next();
            if (constraint.getTAudio() > insertionStartTime){
                constraintsToShift.push(constraint);
            }
        };

        retimerModel.shiftConstraints(constraintsToShift, insertionDuration);

        redrawConstraints();

        insertionStartTime = -1;
    }

    this.beginRecording = function(currentTime) {
        addConstraint(currentTime, ConstraintTypes.Automatic);

        // If recording is an insertion
        if (currentTime < lectureController.getLectureModel().getLectureDuration()){
            insertionStartTime = currentTime;
        }
    }

    this.endRecording = function(currentTime) {
        // If recording is an insertion, shift things back after the insertion start time
        if (insertionStartTime != -1){
            insertionShifting(currentTime);
        }

        addConstraint(currentTime, ConstraintTypes.Automatic);

        // Redraw the thumbnails
        thumbnailsController.drawThumbnails();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    //
    // Button click handlers
    ///////////////////////////////////////////////////////////////////////////////

    // TODO register the click handler
    $('#'+addConstraintButtonID).click(function() {
        drawConstraint();
    });

    $('#'+deleteConstraintButtonID).click(function() {
        deleteConstraints();
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
};
