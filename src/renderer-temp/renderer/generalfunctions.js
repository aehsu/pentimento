function getDistance(v1, v2, x, y){
    var x1 = v1.x,
        x2 = v2.x,
        y1 = v1.y,
        y2 = v2.y;
    if (x !== undefined) {
        x1 = v1;
        y1 = v2;
        x2 = x;
        y2 = y;
    }
    return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function audioToVisual(data, time) {
    if(data.retimer !== undefined) {
        for(var i=1; i<data.retimer.length; i++) {
            if(data.retimer[i].tAudio > time) {
                var now = data.retimer[i].tAudio;
                var prev = data.retimer[i-1].tAudio;
                var interpolatedTime = (time-prev)/(now-prev);
                now = data.retimer[i].tVisual;
                prev = data.retimer[i-1].tVisual;
                return interpolatedTime*(now-prev)+prev;
            }
        }
    }
    return time;
}

function visualToAudio(data, time) {
    if(data.retimer !== undefined) {
        for(var i=1; i<data.retimer.length; i++) {
            if(data.retimer[i].tVisual > time) {
                var now = data.retimer[i].tVisual;
                var prev = data.retimer[i-1].tVisual;
                var interpolatedTime = (time-prev)/(now-prev);
                now = data.retimer[i].tAudio;
                prev = data.retimer[i-1].tAudio;
                return interpolatedTime*(now-prev)+prev;
            }
        }
    }
    return time;
}