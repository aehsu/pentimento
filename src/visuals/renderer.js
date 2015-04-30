"use strict";

var Renderer = function(visuals_controller) {
    var self = this;
    var visualsController = null;

    // Alternate colors for displaying visuals under different circumstances
    var selectedColor = "#0000FF";
    var greyedOutColor = "DDDDDD";

    // Update the canvas to display contents at the specified time
    this.drawCanvas = function(canvas, context, tMin, tMax) {

        // Clear the context
        context.clearRect(0, 0, canvas.width(), canvas.height());
        
        // Get the current transform
        // TODO: uncomment the following line and remove the next line when ready
        // var transformMatrix = getTransformMatrix(tMax);
        var transformMatrix = dummyTransformMatrix;
        
        // Determine the scale
        var xScale = canvas.width() / visualsController.getVisualsModel().getCanvasSize().width;
        var yScale = canvas.height() / visualsController.getVisualsModel().getCanvasSize().height;
        
        // Re-scale transform matrix if necessary
        if (xScale !== 1 || yScale !== 1) {
            for (var k in transformMatrix[0]) {
                transformMatrix[0][k] *= xScale;
            }
            for (var k in transformMatrix[1]) {
                transformMatrix[1][k] *= yScale;
            }
        }
        
        // Transform canvas if necessary
        var isTransformNecessary = !isIdentityTransform(transformMatrix);
        if (isTransformNecessary) {
            context.save();
            context.setTransform(
                transformMatrix[0][0], transformMatrix[0][1],
                transformMatrix[1][0], transformMatrix[1][1],
                transformMatrix[0][2], transformMatrix[1][2]
            );
        }

        var slide = visualsController.getVisualsModel().getSlideAtTime(tMax);
        var visualsIter = slide.getVisualsIterator();
        
        while(visualsIter.hasNext()) {
            var visual = visualsIter.next();
            //visible ON tMin due to equality, deleted ON tDeletion due to lack of equality
            if (visual.isVisible(tMax)) {
                if (visual.isVisible(tMin)) {
                    // visible on tMax AND tMin - therefore was drawn
                    // BEFORE tMin, so draw grayed out
                    drawVisual(context, visual, tMin, greyedOutColor);
                } else {
                    drawVisual(context, visual, tMax);
                }
            }
        }
        
        if (visualsController.currentVisual != null) {
            drawVisual(context, visualsController.currentVisual, tMax);
        };
        for(var i in visualsController.selection) {
            var visual = visualsController.selection[i];
            drawVisual(context, visual, tMax, selectedColor, visual.getProperties().getWidth()+1);
        };
        
        // Restore canvas if necessary
        if (isTransformNecessary) {
            context.restore();
        }
        
    };

    var drawVisual = function(context, visual, tVisual, alternateColor, alternateWidth) {

        if (typeof alternateColor === 'undefined' ) {
            alternateColor = visual.getProperties().getColor();
        };

        if (typeof alternateWidth === 'undefined' ) {
            alternateWidth = visual.getProperties().getWidth();
        };

        //TODO SUPPORT FOR TRANSFORMS
        switch(visual.getType()) {
            case VisualTypes.stroke:
                renderCalligraphicStroke(context, visual, tVisual, alternateColor, alternateWidth);
                break;
            case VisualTypes.dot:
                break;
            case VisualTypes.img:
                break;
            default:
                console.error('unrecognized visual type: ' + visual.getType())
        };
    };

    var renderCalligraphicStroke = function(context, visual, tVisual, renderColor, renderWidth) {
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
                calligraphic_path.push([prev.getX(), prev.getY(), renderWidth, breaking]);
            }
            prev = curr;
        }
        if (curr && tVisual >= curr.getT())
            calligraphic_path.push([curr.getX(), curr.getY(), renderWidth, false]);
        if (calligraphic_path.length > 0) { // draw calligraphic path
            var ctx = context;
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = renderColor;
            ctx.fillStyle = renderColor;
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
    // Transforms
    ///////////////////////////////////////////////////////////////////////////////
    
    // Pre-allocated transform matrix object to avoid new object
    // allocation every time getTransformMatrix is called
    var dummyTransformMatrix = [
        [1,0,0],
        [0,1,0],
        [0,0,1]
    ];
    
    /**
     * Return the interpolated transform matrix for the given time
     * 
     * Matrix of the form:
     * | sx 0  tx |
     * | 0  sy ty |
     * | 0  0  1  |
     * 
     */
    function getTransformMatrix(tVisual) {
        
        // TODO: provide a method in visualsController to get a time-sorted list of slide transforms
        var slideTransforms = visualsController.getSlideTransforms();
        
        var interpolStartTransform = slideTransforms[0];
        var interpolEndTransform = slideTransforms[slideTransforms.length-1];
        
        // Determine the two bounding transforms (closest before/after tVisual)
        for(var i in slideTransforms){
            var transform = slideTransforms[i];
            
            if (transform.getTime() <= tVisual & transform.getTime() > interpolStartTransform.getTime()) {
                interpolStartTransform = transform;
            }
            if (transform.getTime() > tVisual & transform.getTime() < interpolEndTransform.getTime()) {
                interpolEndTransform = transform;
            }
        }
        
        if (interpolEndTransform.getTime() !== interpolStartTransform.getTime()) {
            var interpolFactor = (tVisual - interpolStartTransform.getTime())/(interpolEndTransform.getTime() - interpolStartTransform.getTime());
            
            // Interpolate between each field of the bounding matrices
            var interpolStartMatrix = interpolStartTransform.getMatrix();
            var interpolEndMatrix = interpolEndTransform.getMatrix();
            for (var k in dummyTransformMatrix) {
                dummyTransformMatrix[k] = interpolStartMatrix[k] + (interpolEndMatrix[k] - interpolStartMatrix[k]) * interpolFactor;
            }
        } else {
            
            // If the bounding matrices are simultaneous/the same, simply copy the earlier matrix
            var interpolStartMatrix = interpolStartTransform.getMatrix();
            for (var k in dummyTransformMatrix) {
                dummyTransformMatrix[k] = interpolStartMatrix[k];
            }
        }
        
        return dummyTransformMatrix;
    }
    
    function isIdentityTransform(matrix) {
        for (var i in matrix) {
            for (var j in matrix[i]) {
                if (i === j) {
                    if (matrix[i][j] !== 1) {
                        return false;
                    }
                } else {
                    if (matrix[i][j] !== 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    visualsController = visuals_controller;

};
