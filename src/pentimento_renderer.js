function updateVisuals() {
    clear();
    var slideIter = pentimento.lecture.getSlidesIterator();
    var state = pentimento.state;
    var slideTime = state.videoCursor;
    while(slideIter.hasNext()) {
        var slide = slideIter.next();
        if(slide==state.currentSlide) {
            var visualsIter = slide.getVisualsIterator();
            while(visualsIter.hasNext()) {
                var visual = visualsIter.next();
                //visible ON tMin due to equality, deleted ON tDeletion due to lack of equality
                if (isVisualVisible(visual, slideTime)) {
                    drawVisual(visual, slideTime);
                }
            }
        } else {
            slideTime -= slide.getDuration();
        }
    }
    if (state.currentVisual != null)
        drawVisual(state.currentVisual, globalTime());
    for(var i in state.selection) {
        var visCopy = state.selection[i].getClone();
        var propsCopy = visCopy.getProperties();
        propsCopy.setWidth(propsCopy.getWidth()+1);
        propsCopy.setColor("#0000FF");
        drawVisual(visCopy, slideTime);
    }
}

function clear() {
    pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
}

function drawVisual(visual, tVisual) {
    tVisual = tVisual || pentimento.state.videoCursor;
    //TODO SUPPORT FOR TRANSFORMS
    switch(visual.getType()) {
        case VisualTypes.basic:
            console.log("someone actually made a basic type?!",visual);
            break;
        case VisualTypes.stroke:
            renderCalligraphicStroke(visual, tVisual);
            break;
        case VisualTypes.dot:
            break;
        case VisualTypes.img:
            break;
    }
}

function drawVisuals(visuals) {
    for (var i in visuals) {
        drawVisual(visuals[i]);
    }
}

function renderCalligraphicStroke(visual, tVisual) {
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
        var ctx = pentimento.state.context;
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = visual.getProperties().getColor();
        ctx.fillStyle = visual.getProperties().getColor();
        ctx.lineWidth = 1;
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