var boundingRect;

function preprocess(data, e) {
    data.preprocessed = true;
    boundingRect = {xmin: 0, xmax: 0,
                    ymin: 0, ymax: 0,
                    width: 0,
                    height: 0};
    boundingRect.width = data.width;
    boundingRect.height = data.height;
    for(var i=0; i<data.visuals.length; i++) {
        if(data.visuals[i].type === "stroke")
            data.visuals[i].vertices = RDPalg(data.visuals[i].vertices, e);
    }
    
    // divide stroke into similar-direction
    // polygons for calligraphy
    for(var i=0; i<data.visuals.length; i++) {
        if(data.visuals[i].type === 'stroke') {
            
            var visual = data.visuals[i],
                stroke = visual.vertices;
            
            //remove consecutive points closer than 2px
            var j=0;
            while(j<stroke.length-1 & stroke.length > 10) {
                var point = stroke[j];
                var next = stroke[j+1];
                if(getDistance(point.x, point.y, next.x, next.y) < 2) {
                    stroke.splice(j+1,1);
                }
                else
                    j++;
            }
            
            //amplify noisy low-pressure points at beginning and end
            var clean = false;
            var cleanIndex = 0;
            while(!clean & cleanIndex < stroke.length-1) {
                if(stroke[cleanIndex].pressure < 0.1 | stroke[cleanIndex].pressure < 0.5*stroke[cleanIndex+1].pressure) {
                    stroke[cleanIndex].pressure = stroke[cleanIndex+1].pressure;
                    cleanIndex++;
                }
                else
                    clean = true;
            }
            clean = false;
            cleanIndex = stroke.length-1;
            while(!clean & cleanIndex > 0) {
                if(stroke[cleanIndex].pressure < 0.1 | stroke[cleanIndex].pressure < 0.5*stroke[cleanIndex-1].pressure) {
                    stroke[cleanIndex].pressure = stroke[cleanIndex-1].pressure;
                    cleanIndex--;
                }
                else
                    clean = true;
            }
            
            //straighten straight lines and clean up further
            var begin = stroke[0];
            var end = stroke[stroke.length-1];
            var sumDist = 0;
            var bx = end.x-begin.x;
            var by = end.y-begin.y;
            for(var k in stroke) {
                var point = stroke[k];
                var ax = point.x-begin.x;
                var ay = point.y-begin.y;
                var dot = (ax*bx+ay*by)/(bx*bx+by*by);
                var cx = ax-dot*bx;
                var cy = ay-dot*by;
                sumDist += Math.sqrt(cx*cx+cy*cy);
            }
            if(sumDist < getDistance(begin.x,begin.y,end.x,end.y)/10) {
                j=1;
                while(j<stroke.length-1) {
                    var point=stroke[j];
                    var timescale=(point.t-begin.t)/(end.t-begin.t);
                    point.x=timescale*(end.x-begin.x)+begin.x;
                    point.y=timescale*(end.y-begin.y)+begin.y;
                    var prev=stroke[j-1];
                    if(getDistance(point.x,point.y,prev.x,prev.y)<2)
                        stroke.splice(j,1);
                    else
                        j++;
                }
            }
            
            // use law of cosines to find when
            // a stroke breaks across 45degs
            var cosb;
            
            var j=0;
            while(j<stroke.length-1) {
                var point = stroke[j],
                    next = stroke[j+1];
                var ab = getDistance(Math.round(point.x), Math.round(point.y), Math.round(next.x), Math.round(next.y)),
                    bc = getDistance(Math.round(next.x), Math.round(next.y), Math.round(next.x)+5, Math.round(next.y)+5),
                    ac = getDistance(Math.round(point.x), Math.round(point.y), Math.round(next.x)+5, Math.round(next.y)+5);
                if(ab !== 0 & bc !== 0) {
                    var newcosb = (Math.pow(ab,2)+Math.pow(bc,2)-Math.pow(ac,2))/(2*ab*bc);
                    if(!isNaN(newcosb) & Math.abs(newcosb) > 0.3) {
                        if(cosb !== undefined & newcosb/cosb <= 0) {
                            point.break = true;
                        }
                        cosb = newcosb;
                    }
                }
                j++;
            }
        }
    }

    boundingRect.width = boundingRect.xmax-boundingRect.xmin;
    boundingRect.height = boundingRect.ymax-boundingRect.ymin;
    data.boundingRect = boundingRect;
    data.minZoom = Math.min(data.width/boundingRect.width,data.height/boundingRect.height);
    data.maxZoom = 4;
}

function RDPalg(vertices, e) {
    if(vertices.length < 3)
        return vertices.slice(0);
    var maxDist = 0;
    var index = 0;
    for(var i=1; i<vertices.length-1; i++) {
        boundingRect.xmin = Math.min(boundingRect.xmin, vertices[i].x);
        boundingRect.xmax = Math.max(boundingRect.xmax, vertices[i].x);
        boundingRect.ymin = Math.min(boundingRect.ymin, boundingRect.height-vertices[i].y);
        boundingRect.ymax = Math.max(boundingRect.ymax, boundingRect.height-vertices[i].y);
        var dist = distToLine(vertices[i], vertices[0], vertices[vertices.length-1]);
        if(dist > maxDist) {
            maxDist = dist;
            index = i;
        }
    }
    if(maxDist > e) {
        var left = RDPalg(vertices.slice(0,index), e);
        var right = RDPalg(vertices.slice(index), e);
        return left.concat(right);
    }
    else
        return [vertices[0], vertices[vertices.length-1]];
}

function distToLine(point, begin, end) {
    var ax = point.x-begin.x;
    var ay = point.y-begin.y;
    var bx = end.x-begin.x;
    var by = end.y-begin.y;
    var dot = (ax*bx+ay*by)/(bx*bx+by*by);
    var cx = ax-dot*bx;
    var cy = ay-dot*by;
    return Math.sqrt(cx*cx+cy*cy);
}