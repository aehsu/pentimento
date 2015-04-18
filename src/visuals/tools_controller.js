//Various tools may need to update the state of the view, so the updates are all called here
//within this file for the editing tools. Unfortunately, the undo of an action may need to update
//the view to propertly display a consistent state, so there are invocations of updateVisuals in those
//undo functions as well. It's up to each switch statement to determine when to update 
//the state of the visuals appropriately for each tool
"use strict";

var ToolsController = function(visuals_controller, visuals_model) {

    var visualsController = null;
    var visualsModel = null;

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
    var toolNameAttr = 'toolname';
    var selectTool = 'select';
    var penTool = 'pen';
    var highlightTool = 'highlight';
    var widthTool = 'width';
    var deleteVisualTool = 'delete-visual';
    var addSlideTool = 'add-slide'; 
    var deleteTool = 'delete';
    var redrawTool = 'redraw';
    var deleteSlideTool = 'delete-slide'; 


    ///////////////////////////////////////////////////////////////////////////////
    // Callbacks
    /////////////////////////////////////////////////////////////////////////////// 

    var lectureToolHandler = function(tool, event) {
        switch(tool) {
        	case penToolName:
                visualsController.canvas.on('mousedown', function(event) {
                    if (!lectureController.isRecording()){ return; }
                    event.preventDefault();
                    penMouseDown(event);
                });
                visualsController.canvas.on('mousemove', function(event){
                    if (!lectureController.isRecording()){return;}
                    event.preventDefault();
                    penMouseMove(event);
                });
                visualsController.canvas.on('mouseup', function(event) {
                    if (!lectureController.isRecording()){return;}
                    event.preventDefault();
                    penMouseUp(event);
                });
                visualsController.tool = tool;
                break;
            case highlightToolName:
                visualsController.canvas.on('mousedown', function(event) {
                    if (!lectureController.isRecording()){return;}
                    event.preventDefault();
                    highlightMouseDown(event);
                });
                visualsController.canvas.on('mousemove', function(event) {
                    if (!lectureController.isRecording()){return;}
                    event.preventDefault();
                    highlightMouseMove(event);
                });
                visualsController.canvas.on('mouseup', function(event) {
                    if (!lectureController.isRecording()){return;}
                    event.preventDefault();
                    highlightMouseUp(event);
                });
                visualsController.tool = tool;
                break;
            case addSlide:
                if(lectureController.isRecording()) {
                    visualsController.addSlide();
                }
                lectureToolHandler(visualsController.tool); //restore the previous tool
                break;
        	case widthTool:
                visualsController.width = parseInt($(event.target).val());
                lectureToolHandler(visualsController.tool); //restore the previous tool
        		break;
            case selectTool:
                visualsController.canvas.mousedown(function(event) {
                    if (!lectureController.isRecording()) {return ;}
                    event.preventDefault();
                    lectureSelectMouseDown(event);
                });
                visualsController.canvas.mousemove(function(event) {
                    if (!lectureController.isRecording()||!lectureController.leftMouseButton) {return ;}
                    event.preventDefault();
                    lectureSelectMouseMove(event);
                });
                visualsController.canvas.mouseup(function(event) {
                    if (!lectureController.isRecording()) {return ;}
                    event.preventDefault();
                    lectureSelectMouseUp(event);
                });
                break;
        	case deleteVisualTool:
                visualsModel.setTDeletion(visualsController.selection, currentVisualTime());
        		break;
        	// case 'undo':
         //        lectureToolHandler(visualsController.tool); //restore the previous tool
         //        break;
         //    case 'redo':
         //        lectureToolHandler(visualsController.tool); //restore the previous tool
         //        break;
        	default:
    		    visualsController.tool = null;
        		console.log('Unrecognized tool clicked, live tools');
        		console.log(tool);
                console.log(event);
        }
    };

    //Editing tools handling. These are typically direct invocations of the proper
    //controller to handle the lecture model directly. Therefore, the handling of groups for
    //the editing tools also belongs here.
    var editToolHandler = function(tool, event) {
        switch(tool) {
        	// case 'play': //also includes pause
         //        lectureController.startPlayback(lectureController.getLectureModel().getLectureDuration());
        	// 	break;
         //    case 'pause':
         //        lectureController.stopPlayback();
         //        break;
            case selectTool:
                visualsController.canvas.mousedown(function(event) {
                    if (lectureController.isRecording()) {return ;}
                    event.preventDefault();
                    editSelectMouseDown(event);
                });
                visualsController.canvas.mousemove(function(event) {
                    if (lectureController.isRecording()||!lectureController.leftMouseButton) {return ;}
                    event.preventDefault();
                    editSelectMouseMove(event);
                });
                visualsController.canvas.mouseup(function(event) {
                    if (lectureController.isRecording()) {return ;}
                    event.preventDefault();
                    pentimento.lectureController.getLectureModel().getLectureDuration()
                    editSelectMouseUp(event);
                });
                break;
        	case deleteTool:
                if (lectureController.isRecording() || visualsController.selection.length==0) { return; }
                var t = visualsModel.deleteVisuals(visualsController.currentSlide, visualsController.selection);
                lectureController.getTimeController().updateTime(t);
                // visualsController.selection = []; //Richard says no!
                pentimento.lectureController.getLectureModel().getLectureDuration()
        		break;
            case redrawTool:
                var t = visualsModel.deleteVisuals(visualsController.currentSlide, visualsController.selection);
                lectureController.getTimeController().updateTime(t);
                $('.recording-tool:visible').click()
                break;
            case widthTool:
                if(event.target.value=="" || lectureController.isRecording() || visualsController.selection.length==0) { return; }
                var newWidth = parseInt(event.target.value);
                visualsController.editWidth(visualsController.selection, newWidth);
                pentimento.lectureController.getLectureModel().getLectureDuration()
                $('.edit-tool[data-toolname="width"]').val('');
                break;
            case deleteSlideTool:
                if(lectureController.isRecording()) { return; }
                lectureController.deleteSlide(visualsController.currentSlide);
                // lectureController.getTimeController().updateTime(t);
        	default:
        		console.log('Unrecognized tool clicked, non live tools');
        		console.log(this);
        }
    }



    ///////////////////////////////////////////////////////////////////////////////
    // Helpers
    /////////////////////////////////////////////////////////////////////////////// 


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

        if (visualsController.pressure) { //some fancy stuff based on pressure
            /*var avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

            if (pressure_color) {
                var alpha = (1 - 0.5) + 0.5 * avg_pressure
                line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
            }
            else { line.color = 'rgba(64,64,64,1)' }   // todo use defaults

            if (pressure_width) { line.width = 1 + Math.round(max_extra_line_width * avg_pressure) }  // todo use defaults
            else { line.width = 2 } // todo use defaults

            canvas.drawLine(line)*/
        } else {
            ctx.strokeStyle = segment.getProperties().getColor();
            ctx.lineWidth = segment.getProperties().getWidth();
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }

    var isInside = function(startPoint, endPoint, testPoint) {
        var xStart = startPoint.getX();
        var yStart = startPoint.getY();
        var xEnd = endPoint.getX();
        var yEnd = endPoint.getY();
        var x = testPoint.getX();
        var y = testPoint.getY();
        var xcheck = (xEnd >= xStart && xEnd >= x && x >= xStart) || (xEnd <= xStart && xEnd <= x && x <= xStart);
        var ycheck = (yEnd >= yStart && yEnd >= y && y >= yStart) || (yEnd <= yStart && yEnd <= y && y <= yStart);

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

    //Removes handlers from the previous tool, while preserving other handlers
    //not related to the previous tool
    var clearPreviousHandlers = function() {
        visualsController.canvas.off('mousedown');
        visualsController.canvas.off('mousemove');
        visualsController.canvas.off('mouseup');
        
        //re-attach the necessary ones
        lectureController.loadInputHandlers();
    }

    /***********************************************************************/
    /***********************************************************************/
    /***********************************************************************/

    /**********************************LECTURE-MODE TOOLS**********************************/
    var penMouseDown = function(event) {
        visualsController.currentVisual = new StrokeVisual(currentVisualTime(), new VisualProperty(visualsController.color, visualsController.width));
        visualsController.lastPoint = getCanvasPoint(event);
        visualsController.currentVisual.getVertices().push(visualsController.lastPoint);
        visualsModel.addVisual(visualsController.currentVisual);
    }

    var penMouseMove = function(event) {
        if (lectureController.leftMouseButton) {
            var curPoint = getCanvasPoint(event);
            visualsController.lastPoint = curPoint;
            visualsModel.appendVertex(visualsController.currentVisual, curPoint);
        }
    }

    var penMouseUp = function(event) {
        if(visualsController.currentVisual) { //check for not null and not undefined  != null && !=undefined
            visualsController.currentVisual = null;
            visualsController.lastPoint = null;
        }
    }

    var highlightMouseDown = function(event) {
        penMouseDown(event);
    }

    var highlightMouseMove = function(event) {
        penMouseMove(event);
    }

    var highlightMouseUp = function(event) {
        var highlightTime = 750; //duration for a highlighter, in ms
        if(visualsController.currentVisual) { //check for not null and not undefined  != null && !=undefined
            visualsModel.setTDeletion([visualsController.currentVisual], currentVisualTime() + highlightTime);
            visualsController.currentVisual = null;
            visualsController.lastPoint = null;
        }
    }

    var lectureSelection = function(event) {
        var coord = getCanvasPoint(event);
        var ctx = visualsController.context;
        var visualsIter = visualsController.currentSlide.getVisualsIterator();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            if (!isVisualVisible(visual, lectureController.getTimeController().getTime())) { continue; }

            var nVert = 0;
            var vertIter = visual.getVerticesIterator();
            while (vertIter.hasNext()) {
                var vertex = vertIter.next();
                if (!isVertexVisible(vertex, lectureController.getTimeController().getTime())) { continue; }
                if (isInside(visualsController.lastPoint, coord, vertex)) { nVert++; }
            }
            if(nVert/visual.getVertices().length >= .45 && visualsController.selection.indexOf(visual)==-1) {
                var t = currentVisualTime();
                visualsController.selection.push(visual);
                visualsModel.addProperty(visual, new VisualPropertyTransform("color", "#0000FF", t));
                //TODO should be fixed to be 
                visualsModel.addProperty(visual, new VisualPropertyTransform("width", getLastRelevant(visual, "width", lectureController.getTimeController().getTime()).width+1, t));
            } else if(nVert/visual.getVertices().length < .45 && visualsController.selection.indexOf(visual)>-1) {
                visualsController.selection.splice(visualsController.selection.indexOf(visual), 1);
                visualsModel.addProperty(visual, new VisualPropertyTransform("color", getPreviousLastRelevant(visual, "color", lectureController.getTimeController().getTime()), t));
                visualsModel.addProperty(visual, new VisualPropertyTransform("width", getPreviousLastRelevant(visual, "width", lectureController.getTimeController().getTime()), t));
            }
        }
    }

    var lectureSelectMouseDown = function(event) {
        visualsController.lastPoint = getCanvasPoint(event);
        lectureSelection(event);
    }

    var lectureSelectMouseMove = function(event) {
        var ctx = visualsController.context;
        var coord = getCanvasPoint(event);
        
        lectureSelection(event);

        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 2;
        ctx.strokeRect(visualsController.lastPoint.getX(), visualsController.lastPoint.getY(), coord.getX()-visualsController.lastPoint.getX(), coord.getY()-visualsController.lastPoint.getY());

        ctx.strokeStyle = visualsController.color; // should be valid if you say visualsController.color
        ctx.lineWidth = visualsController.width; // should be valid if you say visualsController.width
    }

    var lectureSelectMouseUp = function(event) {
        //do nothing
    }

    var lectureDelete = function() {

    }
    /**********************************LECTURE-MODE TOOLS**********************************/

    /**********************************EDITING-MODE TOOLS**********************************/
    var editSelectMouseDown = function(event) {
        visualsController.lastPoint = getCanvasPoint(event);
        visualsController.selection = [];
    }

    var editSelectMouseMove = function(event) {
        var coord = getCanvasPoint(event);
        var ctx = visualsController.context;
        visualsController.selection = [];

        var visualsIter = visualsController.currentSlide.getVisualsIterator();
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            if (!isVisualVisible(visual, lectureController.getTimeController().getTime())) { continue; }

            var nVert = 0;
            var vertIter = visual.getVerticesIterator();
            while (vertIter.hasNext()) {
                var vertex = vertIter.next();
                if (!isVertexVisible(vertex, lectureController.getTimeController().getTime())) { continue; }
                if (isInside(visualsController.lastPoint, coord, vertex)) { nVert++; }
            }
            if(nVert/visual.getVertices().length >= .45) {
                visualsController.selection.push(visual);
            }
        }

        pentimento.lectureController.getLectureModel().getLectureDuration()
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 2;
        ctx.strokeRect(visualsController.lastPoint.getX(), visualsController.lastPoint.getY(), coord.getX()-visualsController.lastPoint.getX(), coord.getY()-visualsController.lastPoint.getY());

        ctx.strokeStyle = visualsController.color; // should be valid if you say visualsController.color
        ctx.lineWidth = visualsController.width; // should be valid if you say visualsController.width
    }

    var editSelectMouseUp = function(event) {
        for(var i in visualsController.selection) {
            var visCopy = visualsController.selection[i].getClone();
            var propsCopy = visCopy.getProperties();
            propsCopy.setWidth(propsCopy.getWidth()+1);
            propsCopy.setColor("#0000FF");
            // drawVisual(visCopy, false, 0, false, {});
        }
    }
    /**********************************EDITING-MODE TOOLS**********************************/

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    visualsController = visuals_controller;
    visualsModel = visuals_model;

    $('.lecture-tool').click(function(event) {
        event.stopPropagation(); 
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        lectureToolHandler(tool, event);
    });
    $('.lecture-tool').change(function(event) {
        event.stopPropagation();
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        lectureToolHandler(tool, event);
    });
    $('.edit-tool').click(function(event) {
        var tool = $(event.target).attr('data-toolname');
        clearPreviousHandlers();
        editToolHandler(tool, event);
    });

};