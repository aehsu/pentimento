"use strict";

var Renderer = function(visuals_controller) {
    var self = this;
    var visualsController = null;

    // Update the canvas to display contents at the specified time
    this.drawCanvas = function(canvas, context, tMin, tMax) {

        // Clear the context
        context.clearRect(0, 0, canvas.width(), canvas.height());
        
        // Determine the scale
        var xScale = canvas.width() / visualsController.getVisualsModel().getCanvasSize().width;
        var yScale = canvas.height() / visualsController.getVisualsModel().getCanvasSize().height;
        
        // Set scale if necessary
        if (xScale !== 1 || yScale !== 1) {
            context.save();
            context.scale(xScale, yScale);
        }

        var slide = visualsController.getVisualsModel().getSlideAtTime(tMax);
        var visualsIter = slide.getVisualsIterator();
        
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            //visible ON tMin due to equality, deleted ON tDeletion due to lack of equality
            if (isVisualVisible(visual, tMax)) {
                if (isVisualVisible(visual, tMin)) {
                    // visible on tMax AND tMin - therefore was drawn
                    // BEFORE tMin, so draw grayed out
                    var visCopy = visual.getClone();
                    var propsCopy = visCopy.getProperties();
                    propsCopy.setColor("#DDDDDD");
                    drawVisual(context, visCopy, tMin);
                } else {
                    drawVisual(context, visual, tMax);
                }
            }
        }
        
        if (visualsController.currentVisual != null) {
            drawVisual(context, visualsController.currentVisual, tMax);
        };
        for(var i in visualsController.selection) {
            var visCopy = visualsController.selection[i].getClone();
            var propsCopy = visCopy.getProperties();
            propsCopy.setWidth(propsCopy.getWidth()+1);
            propsCopy.setColor("#0000FF");
            drawVisual(context, visCopy, tMax);
        };
        
        // Restore scale if necessary
        if (xScale !== 1 || yScale !== 1) {
            context.restore();
        }
        
    };

    var drawVisual = function(context, visual, tVisual) {
        //TODO SUPPORT FOR TRANSFORMS
        switch(visual.getType()) {
            case VisualTypes.basic:
                console.log("someone actually made a basic type?!",visual);
                break;
            case VisualTypes.stroke:
                renderCalligraphicStroke(context, visual, tVisual);
                break;
            case VisualTypes.dot:
                break;
            case VisualTypes.img:
                break;
        };
    };

    var renderCalligraphicStroke = function(context, visual, tVisual) {
        var calligraphic_path = [];
        var vertsIter = visual.getVerticesIterator();
        var prev, curr;
        var old_angle;
        var old_direction;

        if(vertsIter.hasNext()) {
            prev = vertsIter.next();
        }
        while (vertsIter.hasNext()) {
            curr = vertsIter.next();
            if (tVisual >= curr.getT()) { // fill path array with only the visible vertices
                var new_angle = absolute_angle(5,-5,curr.getX()-prev.getX(),curr.getY()-prev.getY());
                var new_direction = new_angle >= 0 ? 1 : -1;
                var breaking = false;
                if (old_angle !== undefined) {
                    if (new_angle / old_angle < 0 || new_direction !== old_direction)
                        breaking = true;
                }
                old_angle = new_angle;
                old_direction = new_direction;
                calligraphic_path.push([prev.getX(), prev.getY(), visual.getProperties().getWidth(), breaking]);
            }
            prev = curr;
        }
        if (curr && tVisual >= curr.getT())
            calligraphic_path.push([curr.getX(), curr.getY(), visual.getProperties().getWidth(), false]);
        if (calligraphic_path.length > 0) { // draw calligraphic path
            var ctx = context;
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = visual.getProperties().getColor();
            ctx.fillStyle = visual.getProperties().getColor();
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';
            drawCalligraphicPath(0, calligraphic_path, false, ctx);
        }
    };

    // return the absolute angle in degrees between the specified vectors
    var absolute_angle = function(x1,y1,x2,y2) {
        return Math.acos((x1 * x2 + y1 * y2) / (Math.sqrt(x1*x1+y1*y1) * Math.sqrt(x2*x2+y2*y2)) ) / Math.PI * 180 * (Math.abs(-y1*x2+x1*y2)/(-y1*x2+x1*y2));
    };

    var drawCalligraphicPath = function(startIndex, path, reversed, context) {
        // console.log("path: " + path);
        if(startIndex === 0)
            context.beginPath();
        var point = path[startIndex];
        var endIndex = path.length-1;
        context.moveTo(point[0]+point[2],point[1]-point[2]);
        for(var i=startIndex+1; i<path.length-1; i++) {
            point = path[i];
            if(point[3]) { 
                endIndex = i+1;
                i = path.length-2;
            }
            if(reversed){
                context.lineTo(point[0]-point[2],point[1]+point[2]);
            }
            else{
                context.lineTo(point[0]+point[2],point[1]-point[2]);
            }
        }
        for(var i=endIndex; i>=startIndex; i--) {
            // console.log("here..." + i);
            point = path[i];
            if(reversed){
                context.lineTo(point[0]+point[2],point[1]-point[2]);
            }
            else{
                context.lineTo(point[0]-point[2],point[1]+point[2]);
            }
        }
        point = path[startIndex];
        context.lineTo(point[0]+point[2],point[1]-point[2]);
        if(endIndex !== path.length-1)
            drawCalligraphicPath(endIndex-1, path, !reversed, context);
        else {
            context.stroke();
            context.fill();
        }
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    visualsController = visuals_controller;

};
