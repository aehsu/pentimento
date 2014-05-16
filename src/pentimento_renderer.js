function renderCalligraphicStroke(visual, tVisual) {
    var calligraphic_path = [];
    var vertsIter = visual.getVerticesIterator();
    var prev;
    var old_angle;
    if(vertsIter.hasNext()) {
        prev = vertsIter.next();
        calligraphic_path.push([prev.getX(), prev.getY(), visual.getProperties().getWidth(), false]);
    }
    while (vertsIter.hasNext()) {
        var curr = vertsIter.next();
        var line = new Segment(prev, curr, visual.getProperties());
        if (tVisual >= curr.getT()) { // fill path array with only the visible vertices
            var new_angle = absolute_angle(5,-5,curr.getX()-prev.getX(),curr.getY()-prev.getY());
            var breaking = false;
            if (old_angle !== undefined) {
                if (new_angle / old_angle < 0)
                    breaking = true;
            }
            old_angle = new_angle;
            calligraphic_path.push([curr.getX(), curr.getY(), visual.getProperties().getWidth(), breaking]);
        }
        prev = curr;
    }
    if (calligraphic_path.length > 0) { // draw calligraphic path
        var ctx = pentimento.state.context;
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = visual.getProperties().getColor();
        ctx.lineWidth = visual.getProperties().getWidth();
        ctx.lineCap = 'round';
        drawCalligraphicPath(0, calligraphic_path, false, ctx);
    }
}

// return the absolute angle in degrees between the specified vectors
function absolute_angle(x1,y1,x2,y2) {
    return Math.acos((x1 * x2 + y1 * y2) / (Math.sqrt(x1*x1+y1*y1) * Math.sqrt(x2*x2+y2*y2)) ) / Math.PI * 180 * (Math.abs(-y1*x2+x1*y2)/(-y1*x2+x1*y2));
};

function drawCalligraphicPath(startIndex, path, reversed, context) {
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
        drawCalligraphicPath(endIndex-1, path, !reversed, context);
    else {
        context.stroke();
        context.fill();
    }
}