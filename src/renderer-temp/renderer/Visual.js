/**
 * A superclass for rendering a Visual object
 */
function renderVisual(visual, time, context, xscale, yscale, resourcepath, timeOfPreviousThumb) {
    
    var grayout;
    
    /**
     * Get the current display property of the visual
     */
    function getProperty(time) {
        return visual.properties[visual.properties.length-1];
    }
    
    /**
     * Get the current transform of the visual
     */
    function getTransform(time) {
        for(var i=1; i<visual.transforms.length; i++) {
            if(visual.transforms[i].time > time)
                return visual.transforms[i-1];
        }
        return visual.transforms[visual.transforms.length-1];
    }
    
    /**
     * Render the visual according to 'time' on 'context', with the specified 'xscale' and 'yscale' ratios.
     * 'timeOfPreviousThumb' is defined if rendering thumbnails; specifies the time before which
     *      strokes should be grayed out.
     */
    if (time > visual.tMin) {
        var transform = getTransform(time);
        context.save();
        context.transform(transform.m11, transform.m12,
                          transform.m21, transform.m22,
                          transform.tx/transform.m11*xscale,
                          transform.ty/transform.m22*yscale);
        grayout = timeOfPreviousThumb !== undefined && visual.tEndEdit < timeOfPreviousThumb;
        if (visual.type === 'stroke')
            drawStroke();
        else if (visual.type === 'image')
            drawImage();
        context.restore();
    }
    
    function drawStroke() {

        var vertices = visual.vertices;

        var deleted = false;
        var property = getProperty(time);
        var fadeIndex = 1;

        // fetch display property
        if(property.type === "fadingProperty") {
            var timeBeginFade = visual.tDeletion+property.timeBeginFade;
            var fadeDuration = property.durationOfFade;
            fadeIndex -= (time-timeBeginFade)/fadeDuration;
            if(fadeIndex < 0)
                deleted = true;
        }
        else if(property.type === "basicProperty") {
            if(visual.tDeletion < time)
                deleted = true;
        }

        // proceed to render if visible at 'time'
        if(!deleted || !visual.doesItGetDeleted) {

            // set context properties
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

            // fill array with points to be rendered
            var path = [];
            var previousDrawnIndex = 0;
            for (var j = 0; j < vertices.length; j++) {
                var vertex = vertices[j];
                if (vertex.t < time){
                    if(j==0 | getDistance(vertex, vertices[previousDrawnIndex]) > 1/xscale) {
                        previousDrawnIndex = j;
                        var x=vertex.x*xscale;
                        var y=vertex.y*yscale;
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
                    y = y*yscale;
                    path.push([x,y,vertices[j].pressure*context.lineWidth*3,false]);
                    j = vertices.length;
                }
            }

            // render the array on 'context'
            if(path.length > 0)
                drawPath(0, path, false, context);
        }

        /**
         * Draws a calligraphic stroke based on the points in 'path',
         * recursively creates new polygons according to the 'break' property
         * defined to be true when a calligraphy-bug-inducing angle is found.
         */
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
    }
    
    function drawImage() {
        if (visual.imageObject === undefined) {
            visual.imageObject = document.createElement('img');
            visual.imageObject.src = resourcepath+visual.fileName;
        }
        else {
            var x = visual.x*xscale;
            var y = visual.y*yscale;
            var w = visual.w*xscale;
            var h = visual.h*yscale;
            y -= h;
            context.drawImage(visual.imageObject, x, y, w, h);
        }
    }
};