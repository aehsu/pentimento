// Various tools are used for recording and editing visuals
// The tools controller handles the logic for managing the UI of the tools.
// The responsibility of actually modifying the visuals is delegated to the visuals controller.
"use strict";

var ToolsController = function(visuals_controller) {
    var self = this;

    var visualsController = null;

    // Certain tools can remain active for multiple uses
    var recordingTool = null;
    var editingTool = null;

    // Point to keep track of the beginning of a selection rectangle
    var selectionBeginPoint = null;

    // Pen attributes
    var strokeColor = '#777';
    var strokeWidth = 2;

    // Keep track of original dimensions during a transform
    var originalTranslatePosition;  // { left, top }

    ///////////////////////////////////////////////////////////////////////////////
    // DOM
    /////////////////////////////////////////////////////////////////////////////// 

    // Containers for the different tools during recording and editing
    // Recording tools are used during a recording, and editing tools are used when not recording
    var recordingToolsContainerID = 'visualsRecordingTools';
    var editingToolsContainerID = 'visualsEditingTools';

    // Class for hiding elements
    var hiddenClass = 'hidden';

    // Class for all visual tools
    var toolClass = 'visuals-tool';

    // Tools are recognized by an HTML attribute and name
    // and can be used during recording, editing, or both.
    var toolNameAttr = 'data-toolname';
    var selectTool = 'select';
    var penTool = 'pen';
    var highlightTool = 'highlight';
    var widthTool = 'width';
    var addSlideTool = 'add-slide'; 
    var deleteTool = 'delete';
    var redrawTool = 'redraw';
    var deleteSlideTool = 'delete-slide'; 
    var colorTool = 'color';

    // Box used showing selection area
    var selectionBoxID = 'selectionBox';

    ///////////////////////////////////////////////////////////////////////////////
    // Activating and deactivating tools on recording and playback
    //
    // When state changes among the recording, editing, and playback states, 
    // certain UI elements are hidden or disabled.
    /////////////////////////////////////////////////////////////////////////////// 

    this.startRecording = function() {

        // Activate the current canvas recording tool
        activateCanvasTool();

        // Show the recording tools
        $('#'+recordingToolsContainerID).removeClass(hiddenClass);

        // Hide the editing tools
        $('#'+editingToolsContainerID).addClass(hiddenClass);
    };

    this.stopRecording = function() {

        // Activate the current canvas editing tool
        activateCanvasTool();

        // Show the editing tools
        $('#'+editingToolsContainerID).removeClass(hiddenClass);

        // Hide the recording tools
        $('#'+recordingToolsContainerID).addClass(hiddenClass);
    };

    this.startPlayback = function() {
        // TODO
        // Disable the tools UI
    };

    this.stopPlayback = function() {
        // TODO
        // Enable the tools UI
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Tool Handling
    //
    // There is one main handler for when a tool button is clicked.
    // It is responsible for switching among the tools and determining whether
    // a recording or editing tool was used. It calls the appropriate function
    // for the tool.
    //
    // There are certain things that need to be cleaned up during the transition
    // from one tool to another.
    ///////////////////////////////////////////////////////////////////////////////

    // Handler for when there is a click on one of the tool buttons
    var toolEventHandler = function(event) {
        event.preventDefault();
        event.stopPropagation(); 

        // Reset the selection box
        // Do not clear the selection itself because some tools use it
        resetSelectionBox();

        // Get the tool name through the attribute
        var tool = $(event.target).attr(toolNameAttr);

        // Perform different actions depending on what tool was used.
        // There might be a direct call to the visuals controller,
        // or another handler might be activated for sustained tools (as opposed to a one-time button)
        // Certain tools have different actions depending on whether it is recording or editing.
        switch (tool) {

            // For the canvas related tools, set the tool and then activate it
        	case penTool:
            case highlightTool:
            case selectTool:
                // In recording mode, save the tool as the recording tool,
                // and in editing mode, save the tool as the editing tool.
                if (lectureController.isRecording()) {
                    recordingTool = tool;
                } else {
                    editingTool = tool;
                };
                // Activate the tool
                activateCanvasTool();
                break;

            case addSlideTool:
                visualsController.addSlide();
                break;

            case deleteSlideTool:
                visualsController.deleteSlide(visualsController.currentSlide());
                break;

        	case widthTool:
                // Do nothing. Width is handled by widthChanged() and registered to another function.
                break;

            case colorTool:
                // Do nothing. Color is handled by colorChanged() and registered to another function.
                break;

        	case deleteTool:
                if (lectureController.isRecording()) {
                    visualsController.recordingDeleteSelection();
                } else {
                    visualsController.editingDeleteSelection();
                };
        		break;

            case redrawTool:
                // TODO
                break;

        	default:
        		console.error('Unrecognized tool clicked, recording tools');
        		console.error(tool);
        };
    };

    // This activates a 'sustained' tool on the canvas. This is used for tools
    // such as pen, highlight, and select.
    // The tool that is registerd is the active tool for the current mode (recording/editing)
    var activateCanvasTool = function() {

        // Clear the selection and its box
        visualsController.selection = [];
        resetSelectionBox();

        // Removes the handlers from the previous tools
        visualsController.canvas.off('mousedown');
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');

        visualsController.canvas.off('touchstart');
        visualsController.canvas.off('touchmove');
        visualsController.canvas.off('touchend');
        // In recording mode, activate the recording tool,
        // and in editing mode, activate the editing tool.
        var toolToActivate = ( lectureController.isRecording() ? recordingTool : editingTool );
        console.log('tool to activate: ' + toolToActivate);

        // Register the callback depending on which tool is active
        switch (toolToActivate) {
            case penTool:
                visualsController.canvas.on('mousedown', drawMouseDown);
                visualsController.canvas.on('touchstart', drawMouseDown);
                break;
            case highlightTool:
                visualsController.canvas.on('mousedown', drawMouseDown);
                visualsController.canvas.on('touchstart', drawMouseDown);
                break;
            case selectTool:
                visualsController.canvas.on('mousedown', selectMouseDown);
                visualsController.canvas.on('touchstart', selectMouseDown);
                break;
            default:
                console.error('tool is not a canvas tool and cannot be made active: ' + tool);
        };
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Recording and Editing Tools
    //
    // Tools that work in both recording and editing mode. 
    // Some of the effects might be different depending on whether it is 
    // recording or editing, but the overall handling logic is the same.
    /////////////////////////////////////////////////////////////////////////////// 

    // DRAW: When the mouse is pressed down, activate the mouse move and mouse up handlers and start a new current visual
    var drawMouseDown = function(event) {
        console.log("touchdown: "+strokeColor);
        event.preventDefault();
        event.stopPropagation();

        // touch event
        if(isNaN(event.pageX)){
            var touches = event.originalEvent.changedTouches;

            visualsController.currentVisual = new StrokeVisual(visualsController.currentVisualTime(), new VisualProperty(strokeColor, strokeWidth));
            
            for (var i=0; i < touches.length; i++) {
                visualsController.currentVisual.getVertices().push(getTouchPoint(touches[i].pageX, touches[i].pageY));
            }
        }
        else{
            // Create a new stroke visual and set it to the current visual
            visualsController.currentVisual = new StrokeVisual(visualsController.currentVisualTime(), new VisualProperty(strokeColor, strokeWidth));
            visualsController.currentVisual.getVertices().push(getCanvasPoint(event));
        }


        // Register mouse move and mouse up handlers
        visualsController.canvas.on('mousemove', drawMouseMove);
        visualsController.canvas.on('mouseup', drawMouseUp);

        visualsController.canvas.on('touchmove', drawMouseMove);
        visualsController.canvas.on('touchend', drawMouseUp);
    };

    // SELECT: When the mouse is down and moved, append a new vertext to the current visual
    var drawMouseMove = function(event) {
        console.log('touchmove');
        event.preventDefault();
        event.stopPropagation();

        //touch event
        if(isNaN(event.pageX)){
            var touches = event.originalEvent.changedTouches;

            for (var i=0; i < touches.length; i++) {
                visualsController.currentVisual.appendVertex(getTouchPoint(touches[i].pageX, touches[i].pageY));
            };
        }
        // mouse event
        else{
            // Append a vertex to the current visual
            visualsController.currentVisual.appendVertex(getCanvasPoint(event));            
        }

    };

    // DRAW: When the mouse is released, clear the handlers and add the completed visual
    var drawMouseUp = function(event) {
        console.log('touchend');
        event.preventDefault();
        event.stopPropagation();

        // Add the current visual to then controller and then reset it to null
        visualsController.addVisual(visualsController.currentVisual);
        visualsController.currentVisual = null;

        // Unregister the mouse move and mouse up handlers
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');

        visualsController.canvas.off('touchmove');
        visualsController.canvas.off('touchend');
    };

    // Reset the selection box so that it is not visible and that the UI is turned off
    var resetSelectionBox = function(event) {

        // Hide the selection box and reset the size to 1
        $('#'+selectionBoxID).addClass(hiddenClass)
                             .css('width', 1)
                             .css('height', 1);

        // Turn off events for the overlay so that the selection box creation can work properly
        visualsController.canvasOverlay.css('pointer-events', 'none');
    };

    // SELECT: When the mouse is pressed down, activate the selection box and the mouse move and mouse up handlers
    var selectMouseDown = function(event) {
        event.preventDefault();
        event.stopPropagation();

        if(isNaN(event.pageX)){
            var touches = event.originalEvent.changedTouches;

            for (var i=0; i < touches.length; i++) {
                selectionBeginPoint = getTouchPoint(touches[i].pageX, touches[i].pageY);
            };
        }
        else{
            selectionBeginPoint = getCanvasPoint(event);
        }
        
        // The selection is reset each time the mouse clicks down so that a new
        // selection can be made.
        visualsController.selection = [];
        resetSelectionBox();

        // Register mouse move and mouse up handlers
        visualsController.canvas.on('mousemove', selectMouseMove);
        visualsController.canvas.on('mouseup', selectMouseUp);

        visualsController.canvas.on('touchmove', selectMouseMove);
        visualsController.canvas.on('touchend', selectMouseUp);
    };

    // SELECT: When the mouse is down and moved, update the dimensions of the selection box and select vertices
    var selectMouseMove = function(event) {
        event.preventDefault();
        event.stopPropagation();

        // Update the dimensions of the selection box and make sure it is not hidden
        var coord;

        if(isNaN(event.pageX)){
            var touches = event.originalEvent.changedTouches;

            for (var i=0; i < touches.length; i++) {
                coord = getTouchPoint(touches[i].pageX, touches[i].pageY);
            };
        } 
        else{
            coord = getCanvasPoint(event);
        }
        var left = Math.min(coord.getX(), selectionBeginPoint.getX());
        var right = Math.max(coord.getX(), selectionBeginPoint.getX());
        var top = Math.min(coord.getY(), selectionBeginPoint.getY());
        var bottom = Math.max(coord.getY(), selectionBeginPoint.getY());
        $('#'+selectionBoxID).removeClass(hiddenClass)
                            .css('left', left)
                            .css('top', top)
                            .css('width', right - left)
                            .css('height', bottom - top);

        // Clear the selection every time, but not the box
        visualsController.selection = [];

        // Get the current time
        var currentTime = visualsController.currentVisualTime();

        // Iterate over the visuals of the slide to find ones that are within the bounding box at the current time
        // Add those visuals to the visuals controller's selection.
        var visualsIter = visualsController.currentSlide().getVisualsIterator();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();

            // Ignore visuals that are not visible at the current time
            if ( !visual.isVisible(currentTime) ) { 
                continue;
            };

            // Iterate over the vertices and count the verticies that are
            // visible at the current time and inside the selection box
            var nVert = 0;
            var vertIter = visual.getVerticesIterator();
            while (vertIter.hasNext()) {
                var vertex = vertIter.next();
                if (vertex.isVisible(currentTime) && isInside(selectionBeginPoint, coord, vertex)) { 
                    nVert++; 
                };
            };

            // If more than half of the vertices are selected, then the visual should be added to the selection
            if ( nVert >= visual.getVertices().length / 2 ) {
                visualsController.selection.push(visual);
            };
        };

        // If it is not during a recording, then we manually need to tell the controller to redraw
        if (!lectureController.isRecording()) {
            visualsController.drawVisuals(currentTime);
        };

        // console.log(visualsController.selection);
    };

    // SELECT: When the mouse is released, clear the handlers and turn on dragging and resizing of the box
    var selectMouseUp = function(event) {
        event.preventDefault();
        event.stopPropagation();

        selectionBeginPoint = null;

        // Unregister the mouse move and mouse up handlers
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');

        visualsController.canvas.off('touchmove');
        visualsController.canvas.off('touchend');

        // Turn on events for the overlay canvas to allow dragging and resizing of the div
        visualsController.canvasOverlay.css('pointer-events', 'auto');
    };

    // During a drag, store the original UI element dimensions
    var selectBoxStartTranslate = function(event, ui) {
        var box = $('#'+selectionBoxID);
        originalTranslatePosition = box.position();
    };

    // During recording, handle dragging the select box 
    var selectBoxTranslating = function(event, ui) {
        // TODO: continuous display of the transform
    };

    // While editing, handle finishing (stop) dragging the select box 
    var selectBoxEndTranslate = function(event, ui) {

        // Get the selection box dimensions
        var box = $('#'+selectionBoxID);
        var new_position = box.position();

        // Calculate the transform matrix
        var transform_matrix = calculateTranslateMatrix(originalTranslatePosition, new_position);

        // Apply the matrix to the selected visuals
        if (lectureController.isRecording()) {
            visualsController.recordingSpatialTransformSelection(transform_matrix);
        } else {
            visualsController.editingSpatialTransformSelection(transform_matrix);
        };
    };

    // During recording, handle resizing the select box 
    var selectBoxScaling = function(event, ui) {
        // TODO: continuous display of the transform
    };

    // While editing, handle finishing (stop) resizing the select box 
    var selectBoxEndScale = function(event, ui) {

        // Calculate the transform matrix
        var transform_matrix = calculateScaleMatrix(ui.originalPosition, ui.originalSize, ui.position, ui.size);

        // Apply the matrix to the selected visuals
        if (lectureController.isRecording()) {
            visualsController.recordingSpatialTransformSelection(transform_matrix);
        } else {
            visualsController.editingSpatialTransformSelection(transform_matrix);
        };
    };

    var widthChanged = function(new_width) {

        // Change the width of the drawing tool
        strokeWidth = new_width;

        // Changes the width of the selection if there is a selection
        if (visualsController.selection.length !== 0) {

            if (lectureController.isRecording()) {
                var transform = new VisualPropertyTransform('width', new_width, visualsController.currentVisualTime());
                visualsController.recordingPropertyTransformSelection(transform);

            } else {
                visualsController.editingPropertyTransformSelection('width', new_width);
            };
        }

        // Reset the tool state (clears selection rectangle)
        activateCanvasTool();
    };

    var colorChanged = function(new_spectrum_color) {

        // Change the color of the drawing tool
        var new_color = new_spectrum_color.toHexString();
        if (lectureController.isRecording()) {
            strokeColor = new_color;
        };

        // Changes the color of the selection if there is a selection
        // This check needs to happen in order to fix the problem with double events being triggered.
        if (visualsController.selection.length !== 0) {

            if (lectureController.isRecording()) {
                var transform = new VisualPropertyTransform('color', new_color, visualsController.currentVisualTime());
                visualsController.recordingPropertyTransformSelection(transform);
            } else {
                visualsController.editingPropertyTransformSelection('color', new_color);
            };
        }

        // Reset the tool state (clears selection rectangle)
        activateCanvasTool();

        // TODO: manually hide Spectrum color picker here
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Helpers
    /////////////////////////////////////////////////////////////////////////////// 

    // Tests if the test vertex is inside the rectangle formed by the two verticies.
    var isInside = function(rectPoint1, rectPoint2, testPoint) {
        var x1 = rectPoint1.getX();
        var x2 = rectPoint2.getX();
        var y1 = rectPoint1.getY();
        var y2 = rectPoint2.getY();
        var x = testPoint.getX();
        var y = testPoint.getY();
        var xcheck = (x2 >= x1 && x2 >= x && x >= x1) || (x2 <= x1 && x2 <= x && x <= x1);
        var ycheck = (y2 >= y1 && y2 >= y && y >= y1) || (y2 <= y1 && y2 <= y && y <= y1);

        return xcheck && ycheck;
    }

    // Gives the location of the event on the canvas, as opposed to on the page
    // Returns: Vertex(x,y,t,p) with x,y on the canvas, and t a global time
    var getCanvasPoint = function(event){
        var x = event.pageX - visualsController.canvas.offset().left;
        var y = event.pageY - visualsController.canvas.offset().top;
        var t = visualsController.currentVisualTime();
        
        if(visualsController.pressure) {
            return new Vertex(x, y, t, event.pressure);
        } else {
            return new Vertex(x, y, t);
        }
    }

    var getTouchPoint = function(eventX, eventY){
        var x = eventX - visualsController.canvas.offset().left;
        var y = eventY - visualsController.canvas.offset().top;
        var t = visualsController.currentVisualTime();
        
        if(visualsController.pressure) {
            return new Vertex(x, y, t, event.pressure);
        } else {
            return new Vertex(x, y, t);
        }
    }

    // Given the original and new position of a box in the canvas, calculate and return the math.js matrix
    // necessary to translate the box from the original to the new coordinates.
    // The position is represented as { left, top }
    var calculateTranslateMatrix = function(original_position, new_position) {

        // The matrix necessary to translate is just derived from the difference between the new and old position
        var translateMatrix = math.matrix([ [1, 0,  new_position.left - original_position.left],
                                            [0, 1,  new_position.top - original_position.top],
                                            [0, 0,  1] ]);
        
        return translateMatrix;
    };

    // Given the original and new dimensions of a box in the canvas, calculate and return the math.js matrix
    // necessary to scale the box from the original to the new coordinates.
    // A scale normally ends up translating, so the matrix returned by this function will negate that translation.
    // The position is represented as { left, top }
    // The size is represented as { width, height }
    var calculateScaleMatrix = function(original_position, original_size, new_position, new_size) {
        // http://www.willamette.edu/~gorr/classes/GeneralGraphics/Transforms/transforms2d.htm

        // Calculate the matrix needed to scale the box to the new size
        var widthRatio = new_size.width / original_size.width;
        var heightRatio = new_size.height / original_size.height;
        var scaleMatrix = math.matrix([ [widthRatio, 0, 0], 
                                        [0, heightRatio, 0],
                                        [0, 0, 1]]);

        // Vertices of box starting from top left and moving clockwise
        var boxVertexArray = [  [original_position.left,                        original_position.top,  1], 
                                [original_position.left + original_size.width,  original_position.top,  1], 
                                [original_position.left + original_size.width,  original_position.top + original_size.height,   1], 
                                [original_position.left,                        original_position.top + original_size.height,   1]
                            ];  

        // Apply the scale matrix to the original box to get a purely scaled box
        var newBoxVertexArray = math.multiply(boxVertexArray, scaleMatrix).valueOf();

        // Figure out which corner is the anchor point by comparing the 4 corners and seeing which one didn't change.
        // Find the amount the anchor point shifted after the box was scaled (newBoxVertexArray vs boxVertexArray).
        var shiftX;
        var shiftY;
        if (original_position.left === new_position.left && 
            original_position.top === new_position.top) {  // top left

            shiftX = newBoxVertexArray[0][0] - boxVertexArray[0][0];
            shiftY = newBoxVertexArray[0][1] - boxVertexArray[0][1];

        } else if (original_position.left + original_size.width === new_position.left + new_size.width && 
            original_position.top === new_position.top) {  // top right

            shiftX = newBoxVertexArray[1][0] - boxVertexArray[1][0];
            shiftY = newBoxVertexArray[1][1] - boxVertexArray[1][1];

        } else if (original_position.left + original_size.width === new_position.left + new_size.width &&
            original_position.top + original_size.height === new_position.top + new_size.height) {  // bottom right

            shiftX = newBoxVertexArray[2][0] - boxVertexArray[2][0];
            shiftY = newBoxVertexArray[2][1] - boxVertexArray[2][1];

        } else if (original_position.left === new_position.left &&
            new_position.top + new_size.height === new_position.top + new_size.height) {  // bottom left

            shiftX = newBoxVertexArray[3][0] - boxVertexArray[3][0];
            shiftY = newBoxVertexArray[3][1] - boxVertexArray[3][1];

        } else {  // No corner stayed the same
            console.error('no corner remained the same after scaling/translating');
            console.error(original_position);
            console.error(original_size);
            console.error(new_position);
            console.error(new_size);
        };

        // Calculate the translation matrix necessary to negate the anchor point shift.
        // The shift occurs due to the scaling
        var negateTranslationMatrix = math.matrix([ [1, 0, -shiftX], 
                                                    [0, 1, -shiftY], 
                                                    [0, 0, 1] ]);

        // Multiply negateTranslationMatrix and scaleMatrix to get the final transform matrix
        return math.multiply(negateTranslationMatrix, scaleMatrix);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    visualsController = visuals_controller;

    // Set the initial tools
    recordingTool = penTool;
    editingTool = selectTool;

    // Simulate a recording end because that's what the UI state looks like when it is initialized
    self.stopRecording();

    // Register the handler for the visuals tools
    $('.'+toolClass).click(toolEventHandler);

    // Setup the width tool
    $("["+toolNameAttr+"='"+widthTool+"']").change(function() {
        var new_width = parseInt(event.target.value);
        widthChanged(new_width);
    });

    // Setup the color tool
    $("["+toolNameAttr+"='"+colorTool+"']").spectrum({
        showPaletteOnly: true,
        togglePaletteOnly: true,
        togglePaletteMoreText: 'more',
        togglePaletteLessText: 'less',
        palette: [
            ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
            ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        change: colorChanged
    });


    // Setup the handlers for the draggable and resizable selection box.
    // The same set of handlers is used for dragging and resizing because
    // those are both interpreted as scaling and translating transforms.
    $('#'+selectionBoxID).draggable({
        containment: 'parent',
        start: selectBoxStartTranslate,
        drag: selectBoxTranslating,
        stop: selectBoxEndTranslate
    }).resizable({
        containment: 'parent',
        resize: selectBoxScaling, 
        stop: selectBoxEndScale
    });
};
