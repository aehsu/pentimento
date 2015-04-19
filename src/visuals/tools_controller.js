// Various tools are used for recording and editing visuals
"use strict";

var ToolsController = function(visuals_controller, visuals_model) {

    var visualsController = null;
    var visualsModel = null;

    // Certain tools can remain active for multiple uses
    var recordingTool = null;
    var editingTool = null;

    // Point to keep track of the beginning of a selection rectangle
    var selectionBeginPoint = null;

    ///////////////////////////////////////////////////////////////////////////////
    // DOM
    /////////////////////////////////////////////////////////////////////////////// 

    // Containers for the different tools
    // Recording tools are used during a recording, and editing tools are used when not recording
    var recordingToolsContainerID = 'visualsRecordingTools';
    var editingToolsContainerID = 'visualsEditingTools';

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

    // Box used showing selection area
    var selectionBoxID = 'selectionBox';

    ///////////////////////////////////////////////////////////////////////////////
    // Activating and deactivating tools on recording and playback
    /////////////////////////////////////////////////////////////////////////////// 

    this.startRecording = function() {
        recordingToolActivate(recordingTool);
    };

    this.stopRecording = function() {
        editToolActivate(editingTool);
    };

    this.startPlayback = function() {

    };

    this.stopPlayback = function() {
        editToolActivate(editingTool);
    };

    var recordingToolActivate = function(tool) {
        clearPreviousHandlers();

        switch (tool) {
        	case penTool:
                recordingTool = tool;  // save as active tool
                visualsController.canvas.on('mousedown', drawMouseDown);
                break;
            case highlightTool:
                recordingTool = tool;  // save as active tool
                visualsController.canvas.on('mousedown', drawMouseDown);
                break;
            case selectTool:
                recordingTool = tool;  // save as active tool
                visualsController.canvas.on('mousedown', selectMouseDown);
                break;
            case addSlideTool:
                visualsController.addSlide();
                break;
        	case widthTool:
                visualsController.width = parseInt($('#'+recordingToolsContainerID+' .'+widthTool).val());
        		break;
        	case deleteTool:
                // TODO: this should be a controller method because it should use the undo manager
                visualsModel.setTDeletion(visualsController.selection, currentVisualTime());
        		break;
        	default:
        		console.error('Unrecognized tool clicked, recording tools');
        		console.error(tool);
        };
    };

    //Editing tools handling. These are typically direct invocations of the proper
    //controller to handle the lecture model directly. Therefore, the handling of groups for
    //the editing tools also belongs here.
    var editToolActivate = function(tool) {
        clearPreviousHandlers();

        switch(tool) {
            case selectTool:
                visualsController.canvas.on('mousedown', selectMouseDown);
                editingTool = tool;
                break;
        	case deleteTool:
                // visuals controller delete method needed
                if (visualsController.selection.length==0) { 
                    return;
                }
                var t = visualsModel.deleteVisuals(currentSlide(), visualsController.selection);
                lectureController.getTimeController().updateTime(t);
        		break;
            case redrawTool:
                var t = visualsModel.deleteVisuals(currentSlide(), visualsController.selection);
                lectureController.getTimeController().updateTime(t);
                $('.recording-tool:visible').click()
                break;
            case widthTool:
                if(event.target.value=="" || visualsController.selection.length==0) { return; }
                var newWidth = parseInt(event.target.value);
                visualsController.editWidth(visualsController.selection, newWidth);
                $('.edit-tool[data-toolname="width"]').val('');
                break;
            case deleteSlideTool:
                visualsController.deleteSlide(currentSlide());
        	default:
        		console.error('Unrecognized tool clicked, editing tools');
        		console.error(this);
        }
    }

    //Removes handlers from the previous tool, while preserving other handlers
    //not related to the previous tool
    var clearPreviousHandlers = function() {
        visualsController.canvas.off('mousedown');
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Recording and Editing Tools
    //
    // Tools that work in both recording and editing mode
    /////////////////////////////////////////////////////////////////////////////// 

    var drawMouseDown = function(event) {
        event.preventDefault();

        visualsController.currentVisual = new StrokeVisual(currentVisualTime(), new VisualProperty(visualsController.color, visualsController.width));
        selectionBeginPoint = getCanvasPoint(event);
        visualsController.currentVisual.getVertices().push(selectionBeginPoint);
        visualsModel.addVisual(visualsController.currentVisual);

        // Register mouse move and mouse up handlers
        visualsController.canvas.on('mousemove', drawMouseMove);
        visualsController.canvas.on('mouseup', drawMouseUp);
    };

    var drawMouseMove = function(event) {
        event.preventDefault();
        
        var curPoint = getCanvasPoint(event);
        selectionBeginPoint = curPoint;
        visualsModel.appendVertex(visualsController.currentVisual, curPoint);
    };

    var drawMouseUp = function(event) {
        event.preventDefault();

        visualsController.currentVisual = null;
        selectionBeginPoint = null;

        // Unregister the mouse move and mouse up handlers
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');
    };

    // Selects visuals. Used during recording and editing modes.
    // Calculates which visuals are inside the selection and sets them in the visual controller's selection.
    var visualsSelection = function(event) {

        // Clear the selection every time
        visualsController.selection = [];

        var coord = getCanvasPoint(event);

        // Iterate over the visuals of the slide to find ones that are within the bounding box at the current time
        // Add those visuals to the visuals controller's selection.
        var visualsIter = currentSlide().getVisualsIterator();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();

            // Ignore visuals that are not visible at the current time
            if ( !isVisualVisible(visual, currentVisualTime()) ) { 
                continue;
            }

            // Iterate over the vertices and count the verticies that are
            // visible at the current time and inside the selection box
            var nVert = 0;
            var vertIter = visual.getVerticesIterator();
            while (vertIter.hasNext()) {
                var vertex = vertIter.next();
                if (isVertexVisible(vertex, currentVisualTime) &&
                    isInside(selectionBeginPoint, coord, vertex)) { 
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
            visualsController.drawVisuals(currentVisualTime());
        };
    };

    var selectMouseDown = function(event) {
        event.preventDefault();
        selectionBeginPoint = getCanvasPoint(event);
        visualsController.selection = [];

        // Create a draggable div to indicate the selection box
        var selectionDiv = $('<div></div>').attr('id', selectionBoxID);
        // selectionDiv.draggable({stop: function(event, ui) {
        //     event.preventDefault();
        //     event.stopImmediatePropagation();
        //     // $( event.toElement ).one('click', function(e){ e.stopImmediatePropagation(); } );
        // }});
        selectionDiv.css('width', 0)
                    .css('height', 0);
        visualsController.canvasOverlay.append(selectionDiv);

        // Register mouse move and mouse up handlers
        visualsController.canvas.on('mousemove', selectMouseMove);
        visualsController.canvas.on('mouseup', selectMouseUp);
    };

    var selectMouseMove = function(event) {
        event.preventDefault();

        // Update the dimensions of the selection box
        var coord = getCanvasPoint(event);
        var left = Math.min(coord.getX(), selectionBeginPoint.getX());
        var right = Math.max(coord.getX(), selectionBeginPoint.getX());
        var top = Math.min(coord.getY(), selectionBeginPoint.getY());
        var bottom = Math.max(coord.getY(), selectionBeginPoint.getY());
        $('#'+selectionBoxID).css('left', left)
                            .css('top', top)
                            .css('width', right - left)
                            .css('height', bottom - top);

        // Select the visuals inside the selection box
        visualsSelection(event);
        console.log(visualsController.selection);
    };

    var selectMouseUp = function(event) {
        event.preventDefault();
        selectionBeginPoint = null;

        // Unregister the mouse move and mouse up handlers
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');

        // Remove the the selection box
        $('#'+selectionBoxID).remove();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Recording Mode Tools
    /////////////////////////////////////////////////////////////////////////////// 


    ///////////////////////////////////////////////////////////////////////////////
    // Editing Mode Tools
    /////////////////////////////////////////////////////////////////////////////// 



    ///////////////////////////////////////////////////////////////////////////////
    // Helpers
    /////////////////////////////////////////////////////////////////////////////// 

    // Get the slide at the current time
    var currentSlide = function() {
        return visualsModel.getSlideAtTime(lectureController.getTimeController().getTime());
    };

    // Shortcut for the time controller time converted to visual time through the retimer
    var currentVisualTime = function() {
        return visualsController.getRetimerModel().getVisualTime(lectureController.getTimeController().getTime());
    };

    //This helps in redering, but is fundamental to the tool handlers themselves.
    //Only "finished" visuals leave the buffer and are put into the model, so
    //something needs to draw the buffered visuals, like the handlers.

    //Draws a line segment based on a from point and a to point,
    //with a set of properties. Whoever calls this is in charge of giving the
    //segment the correct properties
    var drawLine = function(segment) {
        var ctx = visualsController.context;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(segment.getFromPoint().getX(), segment.getFromPoint().getY());
        ctx.lineTo(segment.getToPoint().getX(), segment.getToPoint().getY());
        ctx.strokeStyle = segment.getProperties().getColor();
        ctx.lineWidth = segment.getProperties().getWidth();
        ctx.lineCap = 'round';
        ctx.stroke();
    }

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

    var getPreviousLastRelevant = function(visual, property, tVis) {
        var last = getLastRelevant(visual, property, tVis);
        if(property=="width") {
            var prev = visual.getProperties().width;
            var propTrans = visual.getPropertyTransforms();
            for(var i in propTrans) {
                if(propTrans[i].getProperty()=="width" && propTrans[i].getTime() < last.getTime()) {
                    prev = propTrans[i].getValue();
                }
            }
            return prev;
        } else if(property=="color") {
            var prev = visual.getProperties().color;
            var propTrans = visual.getPropertyTransforms();
            for(var i in propTrans) {
                if(propTrans[i].getProperty()=="color" && propTrans[i].getTime() < last.getTime()) {
                    prev = propTrans[i].getValue();
                }
            }
            return prev;
        }
    }

    //property is either width or color
    var getLastRelevant = function(visual, property, tVis) {
        if(property=="width") {
            var last = visual.getProperties();
            var propTrans = visual.getPropertyTransforms();
            for(var i in propTrans) {
                if(propTrans[i].getProperty()=="width" && propTrans[i].getTime() < tVis) {
                    last = propTrans[i];
                }
            }
            return last;
        } else if(property=="color") {
            var last = visual.getProperties();
            var propTrans = visual.getPropertyTransforms();
            for(var i in propTrans) {
                if(propTrans[i].getProperty()=="color" && propTrans[i].getTime() < tVis) {
                    last = propTrans[i];
                }
            }
            return last;
        }
    }

    // Gives the location of the event on the canvas, as opposed to on the page
    // Returns: Vertex(x,y,t,p) with x,y on the canvas, and t a global time
    var getCanvasPoint = function(event){
        var x = event.pageX - visualsController.canvas.offset().left;
        var y = event.pageY - visualsController.canvas.offset().top;
        var t = currentVisualTime();
        
        if(visualsController.pressure) {
            return new Vertex(x, y, t, event.pressure);
        } else {
            return new Vertex(x, y, t);
        }
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    visualsController = visuals_controller;
    visualsModel = visuals_model;

    // Set the initial tools
    recordingTool = penTool;
    editingTool = selectTool;
    // recordingToolActivate(recordingTool);
    editToolActivate(editingTool);

    // Register the handler for the recording tools
    $('#'+recordingToolsContainerID+' .'+toolClass).click(function(event) {

        event.stopPropagation(); 

        // Get the tool name through the attribute
        var tool = $(event.target).attr(toolNameAttr);

        recordingToolActivate(tool);
    });

    // Register the handler for the editing tools
    $('#'+editingToolsContainerID+' .'+toolClass).click(function(event) {

        event.stopPropagation(); 

        // Get the tool name through the attribute
        var tool = $(event.target).attr(toolNameAttr);

        editToolActivate(tool);
    });
};