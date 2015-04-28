///////////////////////////////////////////////////////////////////////////////
// Visuals Model
//
// The visuals model consists of slides.
///////////////////////////////////////////////////////////////////////////////
"use strict";

var VisualsModel = function() {

    var self = this;        
    var slides = [ new Slide() ];  // Setup the visuals with one slide
    var canvasWidth = 800;
    var canvasHeight = 500;

    var dirtyVisuals = [];

    this.getCanvasSize = function() {
        return { 'width':canvasWidth, 'height':canvasHeight };
    };

    this.getDuration = function() {
        var time = 0;
        var iter = self.getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            time += slide.getDuration();
        }
        return time;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Slides
    ///////////////////////////////////////////////////////////////////////////////

    this.getSlides = function() {
        return slides;
    };

    this.getSlidesIterator = function() {
        return new Iterator(slides);
    }
    
    this.getSlideAtTime = function(time) {
        var slide = slides[0];
        var tSlideStart = 0;
        var tSlideEnd = slide.getDuration();
        
        if (time > tSlideStart && time <= tSlideEnd) {
            return slide;
        }
        
        for (var i = 1; i < slides.length; i++) {
            slide = slides[i];
            tSlideStart = tSlideEnd;
            tSlideEnd += slide.getDuration();
            
            if (time > tSlideStart && time <= tSlideEnd) {
                return slide;
            }
        }
        
        return slides[slides.length - 1];
    }
    
    this.insertSlide = function(prevSlide, newSlide) {
        var index = slides.indexOf(prevSlide);
        if (index < 0) {
            console.error('prevSlide does not exist')
            return false;
        };

        slides.splice(index+1, 0, newSlide);

        return true;
    };

    this.removeSlide = function(slide) {
        if (slides.length == 1) {
            console.log("Only one slide left, cannot delete!");
            return false;
        }
        var index = slides.indexOf(slide);
        if (index == -1) { 
            console.log("slide does not exist");
            return false;
        };

        slides.splice(index, 1);

        return true;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Visuals
    ///////////////////////////////////////////////////////////////////////////////

    this.addVisual = function(visual) {
        var slide = self.getSlideAtTime(visual.getTMin());
        slide.getVisuals().push(visual);
    };

    this.deleteVisual = function(visual) {
        var slide = self.getSlideAtTime(visual.getTMin());
        var visuals = slide.getVisuals();

        var index = visuals.indexOf(visual);
        if (index < 0) {
            console.error('visual not found')
            return;
        };

        visuals.splice(index, 1);
    };

    // Creates wrappers around the visuals that keeps track of their previous time
    // and the times of their vertices. Then move the visuals to positive infinity.
    // Used at the end of a recording so that the visuals will not overlap with the ones being recorded.
    // Only processes visuals in the current slide after the current time.
    this.setDirtyVisuals = function(currentVisualTime) {

        var currentSlide = self.getSlideAtTime(currentVisualTime);

        // Iterate over all the visuals
        var visuals_iterator = currentSlide.getVisualsIterator();
        while (visuals_iterator.hasNext()) {
            var visual = visuals_iterator.next();

            // Only make the visual dirty if the time is greater than the current time
            if(visual.getTMin() <= currentVisualTime) {
                continue;
            };

            // Create the wrapper
            var wrapper = {
                visual: visual,
                tMin: visual.getTMin(),
                vertices_times: []
            };

            // Move tMin to infinity
            visual.setTMin(Number.POSITIVE_INFINITY); //could alternatively say Number.MAX_VALUE or Number.MAX_SAFE_INTEGER

            // Add the vertices times to the wrapper and then move them to infinity
            var vertices = visual.getVertices();
            for(var i in vertices) {
                wrapper.vertices_times.push(vertices[i].getT());
                vertices[i].setT(Number.POSITIVE_INFINITY);
            };
            
            // Add the wrapper to dirty visuals
            dirtyVisuals.push(wrapper);

        };  // end of iterating over visuals
    };

    // Restore to the previous time plus the amount.
    // Used at the end of a recording during insertion to shift visuals forward.
    this.cleanVisuals = function(amount) {
        for(var i in dirtyVisuals) {
            var dirtyWrapper = dirtyVisuals[i];
            var visual = dirtyWrapper.visual;
            visual.setTMin(dirtyWrapper.tMin + amount);
            var vertices = visual.getVertices();
            for(var j in vertices) {
                vertices[j].setT(dirtyWrapper.vertices_times[j] + amount);
            };
            //would have to re-enable transforms
        };

        dirtyVisuals = [];
    };

    function doShiftVisual(visual, amount) {
        visual.setTMin(visual.getTMin() + amount);
        var vertIter = visual.getVerticesIterator();
        while(vertIter.hasNext()) {
            var vert = vertIter.next();
            vert.setT(vert.getT() + amount);
        }
        if(visual.getTDeletion()!=null) { visual.setTDeletion(visual.getTDeletion() + amount);}
        var propTransIter = visual.getPropertyTransformsIterator();
        while(propTransIter.hasNext()) {
            var propTrans = propTransIter.next();
            propTrans.setT(propTrans.getT() + amount);
        }
        var spatTransIter = visual.getSpatialTransformsIterator();
        while(spatTransIter.hasNext()) {
            var spatTrans = spatTransIter.next();
            spatTrans.setT(spatTrans.getT() + amount);
        }
    }
    
    this.shiftVisuals = function(visuals, amount) {
        if(visuals.length==0) { 
            return; 
        };
        for(var vis in visuals) { 
            doShiftVisual(visuals[vis], amount);
        };
    }
    
    
    this.deleteVisuals = function(visuals) {
        var indices = [];
        var segments = segmentVisuals(visuals);
        var shifts = getSegmentsShifts(segments);
        var currentSlide = self.getSlideAtTime(visuals[0].getTMin());
        shifts.reverse();
        
        console.log("pre-DELETION visuals"); console.log(currentSlide.visuals);
        console.log("DELETION shifts"); console.log(shifts);
        
        for(var vis in visuals) { //remove the visuals from the slide
            var index = currentSlide.getVisuals().indexOf(visuals[vis]);
            currentSlide.getVisuals().splice(index, 1);
            indices.push(index);
            if(index==-1) { console.log('error in deletion, a visual could not be found on the slide given'); }
        }
        
        console.log("post-DELETION visuals"); console.log(currentSlide.getVisuals());
        
        for(var sh in shifts) {
            var shift = shifts[sh];
            var visualIter = currentSlide.getVisualsIterator();
            while(visualIter.hasNext()) {
                var visual = visualIter.next();
                if(visual.getTMin() >= shift.tMin ) { doShiftVisual(visual, -1.0*shift.duration); } //visual.tMin-1.0*shift.duration
            }
        }
        shifts.reverse();
        //should we change the duration of the slide?!?

        return shifts[0].tMin;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////

    var prevNeighbor = function(visual) {
        var currentSlide = self.getSlideAtTime(visual.getTMin());
        var prev;
        for(vis in currentSlide.visuals) {
            var tMin = currentSlide.visuals[vis].tMin;
            if(tMin < visual.tMin && (prev==undefined || tMin > prev.tMin)) {
                prev = currentSlide.visuals[vis];
            }
        }
        return prev;
    }

    var nextNeighbor = function(visual) {
        var currentSlide = self.getSlideAtTime(visual.getTMin());
        var next;
        for(vis in currentSlide.visuals) {
            var tMin = currentSlide.visuals[vis].tMin;
            if(tMin > visual.tMin && (next==undefined || tMin < next.tMin)) {
                next = currentSlide.visuals[vis];
            }
        }
        return next;
    }
    
    var segmentVisuals = function(visuals) {
        //returns an array of segments, where each segment consists of a set of contiguous visuals
        var cmpVisuals = function(a, b) {
            if(a.tMin < b.tMin) {
                return -1;
            }
            if (b.tMin > a.tMin) {
                return 1;
            }
            return 0;
        }
        var cmpSegments = function(a, b) {
            //only to be used if each segment is sorted!
            if (a[0].tMin < b[0].tMin) {
                return -1;
            }
            if (b[0].tMin > a[0].tMin) {
                return 1;
            }
            return 0;
        }
        var visualsCopy = visuals.slice();
        var segments = [];
        var segment = [];
        var endpoints; //just pointers
        while(visualsCopy.length>0) {
            endpoints = [visualsCopy[0]];
            while(endpoints.length>0) {
                var visual = endpoints.shift();
                segment.push(visual);
                visualsCopy.splice(visualsCopy.indexOf(visual), 1);
                var prevVis = prevNeighbor(visual);
                var nextVis = nextNeighbor(visual);
                if(visualsCopy.indexOf(prevVis) > -1) {
                    endpoints.push(prevVis);
                }
                if(visualsCopy.indexOf(nextVis) > -1) {
                    endpoints.push(nextVis);
                }
            }
            segment.sort(cmpVisuals);
            segments.push(segment);
            segment = [];
        }
        segments.sort(cmpSegments);
        return segments;
    }

    var getSegmentsShifts = function(segments) {
        var shifts = [];
        for(seg in segments) {
            var duration = 0;
            var segment = segments[seg];
            var first = segment[0];
            var last = segment[segment.length-1];
            var next = nextNeighbor(last);
            if (next != undefined) {
                duration += next.tMin-first.tMin;
            } else {
                duration += last.vertices[last.vertices.length-1]['t'] - first.tMin;
            }
            shifts.push({'tMin':first.tMin, 'duration':duration});
        }
        return shifts;
    };
};


///////////////////////////////////////////////////////////////////////////////
// Iterator
//
// Used to create an iterator over objects
/////////////////////////////////////////////////////////////////////////////// 

var Iterator = function(array) {
    return {
        index: -1,
        hasNext: function() { return this.index < array.length-1; },
        next: function() {
            if(this.hasNext()) {
                this.index = this.index + 1;
                return array[this.index];
            }
            return null;
        }        
    };
};


///////////////////////////////////////////////////////////////////////////////
// Slides
//
// Each slide contains visual elements (one of the VisualTypes)
// Slides can also have a transform.
///////////////////////////////////////////////////////////////////////////////

var Slide = function() {
    var visuals = [];
    var transforms = [];
    var duration = 0;  // milliseconds integer
    
    this.getVisuals = function() { return visuals; }
    this.getDuration = function() { return duration; }
    this.getTransforms = function() { return transforms; }

    this.setVisuals = function(newVisuals) { visuals = newVisuals; }
    this.setDuration = function(newDuration) { duration = Math.round(newDuration); }
    this.setTransforms = function(newTransforms) { transforms = newTransforms; }

    this.getVisualsIterator = function() { return new Iterator(visuals); }
    this.getTransformsIterator = function() { return new Iterator(transforms); }
};

var SlideTransform = function(type, tmin, durate, mat) {
    var self = this;
    var tMin = tmin;
    var duration = durate;
    var matrix = mat;

    this.getTMin = function() { return tMin; }
    this.getDuration = function() { return duration; }
    this.getMatrix = function() { return matrix; }
    this.setTMin = function(newTMin) { tMin = Math.round(newTMin); }
    this.setDuration = function(newDuration) { duration = Math.round(newDuration); }
    this.setMatrix = function(newMatrix) { matrix = newMatrix; }
};


///////////////////////////////////////////////////////////////////////////////
// Visual Elements
//
// The different types of visual elements.
///////////////////////////////////////////////////////////////////////////////

var VisualTypes = {
    stroke: "Stroke",
    dot: "Dot",
    img: "IMG"
};

var VisualTransformTypes = {
    Resize: "Resize", 
    Move: "Move",
    Property: "Property"
};

// Abstract base visual class
var Visual = function(tmin, props) {
    var self = this;
    var type = null;
    var hyperlink = null;
    var tDeletion = null;
    var propertyTransforms = [];
    var spatialTransforms = [];
    var tMin = tmin;
    var properties = props;

    this.getType = function() { return type; }
    this.getHyperlink = function() { return hyperlink; }
    this.getTDeletion = function() { return tDeletion; }
    this.getPropertyTransforms = function() { return propertyTransforms; }
    this.getSpatialTransforms = function() { return spatialTransforms; }
    this.getTMin = function() { return tMin; }
    this.getProperties = function() { return properties; }

    this.setType = function(newType) { type = newType; }
    this.setHyperlink = function(newHyperlink) { hyperlink = newHyperlink; }
    this.setTDeletion = function(newTDeletion) { tDeletion = Math.round(newTDeletion); }
    this.setPropertyTransforms = function(newTransforms) { propertyTransforms = newTransforms; }
    this.setSpatialTransforms = function(newTransforms) { spatialTransforms = newTransforms; }
    this.setTMin = function(newTMin) { tMin = Math.round(newTMin); }
    this.setProperties = function(newProperties) { properties = newProperties; }

    this.getPropertyTransformsIterator = function() { return new Iterator(propertyTransforms); }
    this.getSpatialTransformsIterator = function() { return new Iterator(spatialTransforms); }

    // Apply a transform to the visual through all points in time.
    // This is different from pushing a transform, which only applies it at the specified time.
    // The transform is a math.js matrix.
    // This method needs to be overridden by child classes.
    this.applyTransform = function(transform) {
        console.error('Visual.applyTransform() needs to be overridden by child class');
        return;
    };

    // The rule is that visuals are visible exactly ON their tMin, not later
    // Therefore, when time hits tMin, the visual is visible
    // Likewise, visuals are deleted ON their tDeletion, not later
    // Therefore, when time his tDeletion, the visual is no longer visible
    this.isVisible = function(tVisual) {
        if (tMin > tVisual) { 
            return false;
        }
        if (tDeletion != null && tDeletion <= tVisual) {
            return false;
        }
        return true;
    };
};
// Set the constructor in the prototype so child classes can inherit from it
Visual.prototype.constructor = Visual;

var StrokeVisual = function(tmin, props) {
    var self = this;
    Visual.prototype.constructor.call(self, tmin, props);
    self.setType(VisualTypes.stroke);
    var vertices = [];
    
    this.getVertices = function() { return vertices; }
    this.setVertices = function(newVertices) { vertices = newVertices; }
    this.getVerticesIterator = function() { return new Iterator(vertices); }

    this.appendVertex = function(vertex) {
        vertices.push(vertex);
    };

    // this.addProperty = function(property) {
    //     self.getPropertyTransforms().push(property);
    // };

    // Overrides the parent applyTransform()
    // Applies the transform to all the vertices in the stroke.
    this.applyTransform = function(transformMatrix) {
        for (var i = 0; i < vertices.length; i++) {
            var vertexArray = [ vertices[i].getX(), vertices[i].getY(), 1 ];
            var resultVertexArray = math.multiply(transformMatrix, vertexArray).valueOf();
            vertices[i].setX(resultVertexArray[0]);
            vertices[i].setY(resultVertexArray[1]);
        };
    };
};


///////////////////////////////////////////////////////////////////////////////
// Visual properties and transforms
///////////////////////////////////////////////////////////////////////////////

var VisualProperty = function(c, w) {
    var self = this;
    var color = c;
    var width = w;

    this.getColor = function() { return color; }
    this.setColor = function(newColor) { color = newColor; }
    this.getWidth = function() { return width; }
    this.setWidth  = function(newWidth) { width = Math.round(newWidth); }
};

var VisualPropertyTransform = function(prop, newVal, time) {
    var self = this;
    var property = prop;
    var value = newVal;
    var duration = 0;
    var t = time;

    this.getProperty = function() { return property; }
    //no setter for the property, users should instead just create a new transform for a different property
    this.getValue = function() { return value; }
    this.setValue = function(newVal) { value = newVal; }
    this.getDuration = function() { return duration; }
    this.setDuration = function(newDuration) { duration = Math.round(newDuration); }
    this.getTime = function() { return t; }
    this.setTime = function(newTime) { t = Math.round(newTime); }
};

var VisualSpatialTransform = function(mat, time) {
    var self = this;
    var matrix = mat;  // math.js matrix
    var duration = 0;
    var t = time;

    this.getMatrix = function() { return matrix; }
    this.setMatrix = function(newMatrix) { matrix = newMatrix; }
    this.getDuration = function() { return duration; }
    this.setDuration = function(newDuration) { duration = Math.round(newDuration); }
    this.getTime = function() { return time; }
    this.setTime = function(newTime) { t = Math.round(newTime); }
};

///////////////////////////////////////////////////////////////////////////////
// Visual properties and transforms
///////////////////////////////////////////////////////////////////////////////

//could potentially migrate a vertex to have a tMin and a tDeletion
var Vertex = function(myX, myY, myT, myP) {
    var self = this;
    var x = myX;
    var y = myY;
    var t = myT;
    var p = myP;

    this.getX = function() { return x; }
    this.getY = function() { return y; }
    this.getT = function() { return t; }
    this.getP = function() { return p; }

    this.setX = function(newX) { x = newX; }
    this.setY = function(newY) { y = newY; }
    this.setT = function(newT) { t = newT; }
    this.setP = function(newP) { p = newP; }    

    // Returns a boolean indicating whether the vertex is visible at the given time
    this.isVisible = function(tVisual) {
        return t <= tVisual;
    };
};
