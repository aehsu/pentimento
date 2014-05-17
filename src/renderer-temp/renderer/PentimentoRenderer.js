/**
 * - canvas_container: the jQuery-wrapped element which contains the canvas (not the canvas itself)
 * - data: the raw lecture data Javascript object
 * - resourcepath: the path to resources (images, etc)
 */
var PentimentoRenderer = function(canvas_container, data, resourcepath) {
    
    var jq_canvas = canvas_container.find("canvas");
    var main_canvas = jq_canvas[0];
    var main_context = main_canvas.getContext('2d');
    
    var freePosition = false;
    var transformMatrix = {
        m11: 1, m12: 0, m21: 0, m22: 1,
        tx: 0, ty: 0
    };
    var animateID;
    var startTime;
    var main_xscale = main_canvas.width/data.width;
    var main_yscale = main_canvas.height/data.height;
    
    /**
     * Responds to events fired by PentimentoListener
     */
    this.fire = function (info) {
        if(info.event === 'pan') {
            freePosition = true;
            transformMatrix.tx += info.data.dx;
            transformMatrix.ty += info.data.dy;
            if(info.data.paused) this.renderFrame(info.data.time);
        }
        else if(info.event === 'zoomIn') {
            freePosition = true;
            animateZoom(Math.min(transformMatrix.m11*3/2,data.maxZoom), info.data);
        }
        else if(info.event === 'zoomOut') {
            freePosition = true;
            animateZoom(Math.max(transformMatrix.m11*2/3,data.minZoom), info.data);
        }
        else if(info.event === 'doubleclick') {
            freePosition = true;
            animateZoom(transformMatrix.m11===1?2:1, info.data, info.data.cx, info.data.cy);
        }
        else if(info.event === 'minZoom') {
            freePosition = true;
            animateZoom(data.minZoom, info.data);
        }
        else if(info.event === 'refocus') {
            if(freePosition) {
                animateToPos(getCameraTransform(info.data.time+0.5, main_canvas), 500, info.data, function() {
                    freePosition = false;
                });
            }
        }
        else if(info.event === 'resize') {
            main_xscale = main_canvas.width/data.width;
            main_yscale = main_canvas.height/data.height;
        }
    }
    
    /**
     * Render a frame at 'time'.
     * 'timeOfPreviousThumb' and 'thumbCanvas' are defined if rendering thumbnails.
     */
    function renderFrame(time, timeOfPreviousThumb, thumbCanvas) {
        
        // get retimed time
        time = audioToVisual(data, time);
        
        // determine which canvas to render on (main or thumb)
        var canvas = thumbCanvas || main_canvas;
        var context = canvas.getContext('2d');
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        var isThumb = timeOfPreviousThumb !== undefined;
        
        // ignore user transform if rendering a thumbnail
        if(isThumb) {
            var initialFree = freePosition;
            freePosition = false;
            prepareFrame(time, canvas, context);
            freePosition = initialFree;
        }
        else {
            prepareFrame(time, canvas, context);
        }
        
        // render all visuals (they are all wrapped in renderer classes)
        for(var i=0; i<data.visuals.length; i++){
            renderVisual(data.visuals[i], time, context, xscale, yscale, resourcepath, timeOfPreviousThumb);
        }
    }
    this.renderFrame = renderFrame;
    
    /**
     * Returns a jQuery-wrapped canvas of the specified size rendered with a frame
     * at the specified time.
     */
    this.getThumbCanvas = function (width, height, time, timeOfPreviousThumb) {
        var thumbCanvas = $('<canvas width='+width+' height='+height+'></canvas>')[0];
        this.renderFrame(time, timeOfPreviousThumb, thumbCanvas);
        return thumbCanvas;
    }
    
    /**
     * Prepare the canvas for rendering a new frame.
     */
    function prepareFrame(time, canvas, context) {
        // clear the canvas
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = 'rgb('+Math.round(data.backgroundColor.red*255)+','+
            Math.round(data.backgroundColor.green*255)+','+Math.round(data.backgroundColor.blue*255)+')';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // set the transform
        setCameraTransform(time, canvas, context);
    }
    
    /**
     * Transform the canvas context, update transformMatrix
     */
    function setCameraTransform(time, canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        if(!freePosition) {
            transformMatrix = getCameraTransform(time, canvas);
        }
        
        if(data.preprocessed & freePosition) {
            transformMatrix.m11 = Math.max(transformMatrix.m11, data.minZoom);
            transformMatrix.m22 = Math.max(transformMatrix.m22, data.minZoom);
            transformMatrix.tx = Math.min(Math.max(transformMatrix.tx,
                                                   canvas.width-data.boundingRect.xmax*xscale*transformMatrix.m11),
                                          -data.boundingRect.xmin*xscale*transformMatrix.m11);
            transformMatrix.ty = Math.min(Math.max(transformMatrix.ty,
                                                   canvas.height-data.boundingRect.ymax*yscale*transformMatrix.m22),
                                          -data.boundingRect.ymin*yscale*transformMatrix.m22);
            
            // draw fake scrollbars
            drawScrollBars(canvas, context);
        }
        
        context.setTransform(transformMatrix.m11, transformMatrix.m12,
                             transformMatrix.m21, transformMatrix.m22,
                             transformMatrix.tx, transformMatrix.ty);
        
        // draw box showing where the camera transform is relative to the user transform
        if(freePosition) {
            var box = getCameraTransform(time, canvas);
            drawBox(box.tx, box.ty, box.m11, box.m22, canvas, context);
        }
    }
    
    /**
     * Return the interpolated camera transform matrix for the given time
     */
    function getCameraTransform(time, canvas) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        var cameraChanges = data.cameraTransforms;
        var nextTransform = cameraChanges[cameraChanges.length-1];
        var previousTransform = cameraChanges[0];
        for(var i=0; i<cameraChanges.length; i++){
            var currentTransform = cameraChanges[i];
            if (currentTransform.time < time & currentTransform.time > previousTransform.time) {
                previousTransform = currentTransform;
            }
            if(currentTransform.time > time & currentTransform.time < nextTransform.time) {
                nextTransform = currentTransform;
            }
        }
        var newTransformMatrix = $.extend(true,{},previousTransform);
        if (nextTransform.time !== previousTransform.time) {
            var interpolatedTime = (time - previousTransform.time)/(nextTransform.time - previousTransform.time);
            newTransformMatrix.m11 = previousTransform.m11+(nextTransform.m11 - previousTransform.m11)*interpolatedTime;
            newTransformMatrix.m22 = previousTransform.m22+(nextTransform.m22 - previousTransform.m22)*interpolatedTime;
            newTransformMatrix.tx = previousTransform.tx+(nextTransform.tx - previousTransform.tx)*interpolatedTime;
            newTransformMatrix.ty = previousTransform.ty+(nextTransform.ty - previousTransform.ty)*interpolatedTime;
        }
        newTransformMatrix.tx = newTransformMatrix.tx/newTransformMatrix.m11*xscale;
        newTransformMatrix.ty = newTransformMatrix.ty/newTransformMatrix.m22*yscale;
        return newTransformMatrix;
    }
    
    /**
     * Draws fake scrollbars on the canvas
     */
    function drawScrollBars(canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        var tx = transformMatrix.tx;
        var ty = transformMatrix.ty;
        var zx = transformMatrix.m11;
        var zy = transformMatrix.m22;
        context.beginPath();
        context.strokeStyle = 'rgba(0,0,0,0.2)';
        context.lineCap = 'round';
        context.lineWidth = 8;
        var scrollBarLeft = (-tx-data.boundingRect.xmin*xscale*zx)/(data.boundingRect.width*xscale*zx)*canvas.width+10;
        var scrollBarTop = (-ty-data.boundingRect.ymin*yscale*zy)/(data.boundingRect.height*yscale*zy)*canvas.height+10;
        var scrollBarWidth = data.width/data.boundingRect.width/zx*canvas.width-20;
        var scrollBarHeight = data.height/data.boundingRect.height/zy*canvas.height-20;
        context.moveTo(scrollBarLeft, canvas.height-10);
        context.lineTo(scrollBarLeft+scrollBarWidth, canvas.height-10);
        context.moveTo(canvas.width-10, scrollBarTop);
        context.lineTo(canvas.width-10, scrollBarTop+scrollBarHeight);
        context.stroke();
    }
    
    /**
     * Draws a blue bounding box showing camera transform position relative to user transform
     */
    function drawBox(tx, ty, zx, zy, canvas, context) {
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        context.beginPath();
        context.strokeStyle = 'rgba(0,0,255,0.1)';
        context.lineCap = 'butt';
        context.lineWidth = 5/zx;
        var width = data.width*xscale/zx;
        var height = data.height*yscale/zy
        context.moveTo(-tx, -ty);
        context.lineTo(-tx+width, -ty);
        context.lineTo(-tx+width, -ty+height);
        context.lineTo(-tx, -ty+height);
        context.lineTo(-tx, -ty);
        context.stroke();
    }
    
    /**
     * Animates the frame using quintic easing from an old transform (tx, ty, tz)
     * to a new transform (nx, ny, nz)
     */
    function animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, bounded) {
        clearTimeout(animateID);
        
        if(bounded===undefined) {
            nz = Math.min(Math.max(nz,data.minZoom),data.maxZoom);
            nx = Math.min(Math.max(nx,main_canvas.width-data.boundingRect.xmax*main_xscale*nz),-data.boundingRect.xmin*main_xscale);
            ny = Math.min(Math.max(ny,main_canvas.height-data.boundingRect.ymax*main_yscale*nz),-data.boundingRect.ymin*main_yscale);
        }
        
        var interpolatedTime = Math.pow((Date.now() - startTime)/duration-1,5)+1; // quintic easing
        
        if(Date.now()-startTime > duration | (tx === nx & ty === ny & tz === nz)) {
            transformMatrix.tx = nx, transformMatrix.ty = ny, transformMatrix.m11 = nz, transformMatrix.m22 = nz;
            if(callback !== undefined)
                callback();
            if(info.paused) {
                renderFrame(info.time);
            }
        }
        else {
            transformMatrix.m11 = tz + (nz - tz)*interpolatedTime;
            transformMatrix.m22 = transformMatrix.m11;
            transformMatrix.tx = tx + (nx - tx)*interpolatedTime;
            transformMatrix.ty = ty + (ny - ty)*interpolatedTime;
            
            if(info.paused) {
                renderFrame(info.time);
            }
            
            animateID = setTimeout(function() {
                animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, true);
            }, 33);
        }
    };
    function animateToPos(newMatrix, duration, info, callback) {
        animateToPosHelper(Date.now(), duration, transformMatrix.tx, transformMatrix.ty, transformMatrix.m11,
                           newMatrix.tx, newMatrix.ty, newMatrix.m11, info, callback);
    }
    
    /**
     * Animation for zoom-only transforms.
     * Zooms in on center of visible display.
     */
    function animateZoom(nz, info, cx, cy) {
        if(cx === undefined)
            cx = main_canvas.width/2;
        if(cy === undefined)
            cy = main_canvas.height/2;
        var nx = transformMatrix.tx + (1-nz/transformMatrix.m11)*(cx-transformMatrix.tx);
        var ny = transformMatrix.ty + (1-nz/transformMatrix.m22)*(cy-transformMatrix.ty);
        freePosition = true;
        animateToPos({m11: nz, m12: 0, m21: 0, m22: nz, tx: nx, ty: ny}, 500, info);
    };
    
    // returns the current context transform
    this.transformMatrix = function () {
        return transformMatrix;
    }
};