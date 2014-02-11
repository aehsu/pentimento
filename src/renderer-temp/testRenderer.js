/*
 *  Renders one frame.
 *  - data: JSON object
 *  - canvas: HTML canvas
 *  - time: timestamp of frame to render
 *
 */

var PentimentoRenderer = function(canvas_container, data, resourcepath) {
    
    var Visual = function (d) {
        this.getProperty = function (time) {
            return d.properties[d.properties.length-1];
        }
        this.getTransform = function (time) {
            for(var i=1; i<d.transforms.length; i++) {
                if(d.transforms[i].time > time)
                    return d.transforms[i-1];
            }
            return d.transforms[d.transforms.length-1];
        }
        this.render = function (time, context, xscale, yscale, timeOfPreviousThumb) {
            if (time > d.tMin) {
                var transform = this.getTransform(time);
                context.save();
                context.transform(transform.m11, transform.m12,
                                  transform.m21, transform.m22,
                                  transform.tx/transform.m11*xscale,
                                  transform.ty/transform.m22*yscale);
                var grayout = timeOfPreviousThumb !== undefined && d.tEndEdit < timeOfPreviousThumb;
                this.drawSelf(time, context, xscale, yscale, grayout);
                context.restore();
            }
        }
    }
    
    var Image = function (d) {
        $.extend(this, new Visual(d));
        var imageObject = document.createElement('img');
        imageObject.src = resourcepath+d.fileName;
        this.drawSelf = function (time, context, xscale, yscale) {
            var x = d.x*xscale;
            var y = (data.height-d.y)*yscale;
            var w = d.w*xscale;
            var h = d.h*yscale;
            y -= h;
            context.drawImage(imageObject, x, y, w, h);
        }
    }
    
    var Stroke = function (d) {
        $.extend(this, new Visual(d));
        var vertices = d.vertices;
        this.drawSelf = function (time, context, xscale, yscale, grayout) {
            var deleted = false;
            var property = this.getProperty(time);
            var fadeIndex = 1;
            if(property.type === "fadingProperty") {
                var timeBeginFade = d.tDeletion+property.timeBeginFade;
                var fadeDuration = property.durationOfFade;
                fadeIndex -= (time-timeBeginFade)/fadeDuration;
                if(fadeIndex < 0)
                    deleted = true;
            }
            else if(property.type === "basicProperty") {
                if(d.tDeletion < time)
                    deleted = true;
            }
            if(!deleted || !d.doesItGetDeleted) {
                if(grayout) {
                    context.fillStyle = "rgba(100,100,100,0.3)";
                    context.strokeStyle = "rgba(50,50,50,0.3)";
                }
                else {
                    context.fillStyle="rgba("+Math.round(property.redFill*255)+","+Math.round(property.greenFill*255)+
                                      ","+Math.round(property.blueFill*255)+","+(property.alphaFill*fadeIndex)+")";
                    
                    context.strokeStyle="rgba("+Math.round(property.red*255)+","+Math.round(property.green*255)+
                                      ","+Math.round(property.blue*255)+","+(property.alpha*fadeIndex)+")";
                }
                
                context.lineWidth = property.thickness*xscale/10;
            
                var path = [];
                
                var previousDrawnIndex = 0;
                for (var j = 0; j < vertices.length; j++) {
                    var vertex = vertices[j];
                    if (vertex.t < time){
                        if(j==0 | getDistance(vertex, vertices[previousDrawnIndex]) > 1/xscale) {
                            previousDrawnIndex = j;
                            var x=vertex.x*xscale;
                            var y=(data.height-vertex.y)*yscale;
                            var pressure = vertex.pressure;
                            var breaking = vertex.break || false;
                            path.push([x,y,pressure*context.lineWidth*3,breaking]);
                        }
                    }
                    else if(j > 0) {
                        var interpolation = (time-vertices[j-1].t)/(vertices[j].t-vertices[j-1].t);
                        var x = interpolation*(vertices[j].x-vertices[j-1].x)+vertices[j-1].x;
                        var y = interpolation*(vertices[j].y-vertices[j-1].y)+vertices[j-1].y;
                        x = x*xscale;
                        y = (data.height-y)*yscale;
                        path.push([x,y,vertices[j].pressure*context.lineWidth*3,false]);
                        j = vertices.length;
                    }
                }
                if(path.length > 0)
                    drawPath(0, path, false, context);
            }
        }
    }
    
    for (var i in data.visuals) {
        if (data.visuals[i].type === 'stroke')
            data.visuals[i] = new Stroke(data.visuals[i]);
        else if(data.visuals[i].type === 'image')
            data.visuals[i] = new Image(data.visuals[i]);
        else
            console.log(data.visuals[i].type);
    }
    
    var jq_canvas = canvas_container.find('canvas');
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
    
    function getPageFlipTime(time) {
        for(var i=1; i<data.pageFlips.length; i++) {
            if(data.pageFlips[i].time > time)
                return data.pageFlips[i-1].time;
        }
        return data.pageFlips[data.pageFlips.length-1].time;
    }

    this.renderFrame = function (time, timeOfPreviousThumb, thumbCanvas) {
        
        time = audioToVisual(data, time);
        
        var canvas = thumbCanvas || main_canvas;
        var context = canvas.getContext('2d');
        var xscale = canvas.width/data.width;
        var yscale = canvas.height/data.height;
        
        var isThumb = timeOfPreviousThumb !== undefined;
        
        if(isThumb) {
            var initialFree = freePosition;
            freePosition = false;
            prepareFrame(time, canvas, context);
            freePosition = initialFree;
        }
        else {
            prepareFrame(time, canvas, context);
        }
        
        var pageFlipTime = getPageFlipTime(time);
        
        for(var i=0; i<data.visuals.length; i++){
            data.visuals[i].render(time, context, xscale, yscale, timeOfPreviousThumb);
        }
    }
    
    this.getThumbCanvas = function (width, height, time, timeOfPreviousThumb) {
        var thumbCanvas = $('<canvas width='+width+' height='+height+'></canvas>')[0];
        this.renderFrame(time, timeOfPreviousThumb, thumbCanvas);
        return thumbCanvas;
    }
    
    function prepareFrame(time, canvas, context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = 'rgb('+Math.round(data.backgroundColor.red*255)+','+
            Math.round(data.backgroundColor.green*255)+','+Math.round(data.backgroundColor.blue*255)+')';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        setCameraTransform(time, canvas, context);
    }
    
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
            drawScrollBars(canvas, context);
        }
        
        context.setTransform(transformMatrix.m11, transformMatrix.m12,
                             transformMatrix.m21, transformMatrix.m22,
                             transformMatrix.tx, transformMatrix.ty);
        $('iframe').css('-webkit-transform',
                        'matrix('+transformMatrix.m11/2+','+
                        transformMatrix.m12+','+transformMatrix.m21+','+
                        transformMatrix.m22/2+','+transformMatrix.tx+','+
                        transformMatrix.ty+')');
        
        if(freePosition) {
            var box = getCameraTransform(time, canvas);
            drawBox(box.tx, box.ty, box.m11, box.m22, canvas, context);
        }
    }
    
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
        newTransformMatrix.ty = -newTransformMatrix.ty;
        newTransformMatrix.tx = newTransformMatrix.tx/newTransformMatrix.m11*xscale;
        newTransformMatrix.ty = newTransformMatrix.ty/newTransformMatrix.m22*yscale;
        return newTransformMatrix;
    }
    
    function drawPath(startIndex, path, reversed, context) {
        if(startIndex === 0)
            context.beginPath();
        var point = path[startIndex];
        var endIndex = path.length-1;
        context.moveTo(point[0]+point[2],point[1]-point[2]);
        for(var i=startIndex+1; i<path.length-1; i++) {
            point = path[i];
            if(point[3]) { // 
                endIndex = i+1;
                i = path.length-2;
            }
            if(reversed)
                context.lineTo(point[0]-point[2],point[1]+point[2]);
            else
                context.lineTo(point[0]+point[2],point[1]-point[2]);
        }
        for(var i=endIndex; i>=startIndex; i--) {
            point = path[i];
            if(reversed)
                context.lineTo(point[0]+point[2],point[1]-point[2]);
            else
                context.lineTo(point[0]-point[2],point[1]+point[2]);
        }
        point = path[startIndex];
        context.lineTo(point[0]+point[2],point[1]-point[2]);
        if(endIndex !== path.length-1)
            drawPath(endIndex-1, path, !reversed, context);
        else {
            context.stroke();
            context.fill();
        }
    }
    
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
    
    function animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, bounded) {
        clearTimeout(animateID);
//        displayZoom(nz);
        
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
                this.renderFrame(info.time);
            }
        }
        else {
            transformMatrix.m11 = tz + (nz - tz)*interpolatedTime;
            transformMatrix.m22 = transformMatrix.m11;
            transformMatrix.tx = tx + (nx - tx)*interpolatedTime;
            transformMatrix.ty = ty + (ny - ty)*interpolatedTime;
            
            if(info.paused) {
                this.renderFrame(info.time);
            }
            
            animateID = setTimeout(function() {
                animateToPosHelper(startTime, duration, tx, ty, tz, nx, ny, nz, info, callback, true);
            }, 33);
        }
    }
    function animateToPos(newMatrix, duration, info, callback) {
        animateToPosHelper(Date.now(), duration, transformMatrix.tx, transformMatrix.ty, transformMatrix.m11,
                           newMatrix.tx, newMatrix.ty, newMatrix.m11, info, callback);
    }
    
    /*************************
    *
    *   animated zoom when using side buttons
    *   zooms in on point (cx,cy), defaults to center screen
    *************************/
    function animateZoom(nz, info, cx, cy) {
        if(cx === undefined)
            cx = main_canvas.width/2;
        if(cy === undefined)
            cy = main_canvas.height/2;
        var nx = transformMatrix.tx + (1-nz/transformMatrix.m11)*(cx-transformMatrix.tx);
        var ny = transformMatrix.ty + (1-nz/transformMatrix.m22)*(cy-transformMatrix.ty);
        freePosition = true;
        animateToPos({m11: nz, m12: 0, m21: 0, m22: nz, tx: nx, ty: ny}, 500, info);
    }
    
    this.transformMatrix = function () {
        return transformMatrix;
    }
};