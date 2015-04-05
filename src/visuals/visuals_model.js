///////////////////////////////////////////////////////////////////////////////
// Visuals Model
//
// The visuals model consists of slides.
///////////////////////////////////////////////////////////////////////////////
"use strict";

var VisualsModel = function() {

    var slides = [];

    this.getDuration = function() {
        var time = 0;
        var iter = self.getSlidesIterator();
        while(iter.hasNext()) {
            var slide = iter.next();
            time += slide.getDuration();
        }
        return time;
    };

    this.getSlides = function() {
        return slides;
    };

    this.getSlidesIterator = function() {
        return new Iterator(slides);
    }
    
    // this.getConstraintsIterator = function() { return new Iterator(constraints); }

    this.insertSlide = function(prevSlide, newSlide) {
        var index = slides.indexOf(prevSlide);

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
    // Initialization
    //
    // Setup the visuals with one slide
    /////////////////////////////////////////////////////////////////////////////// 

    slides.push(new Slide());
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
    var duration = 0.0;
    
    this.getVisuals = function() { return visuals; }
    this.getDuration = function() { return duration; }
    this.getTransforms = function() { return transforms; }

    this.setVisuals = function(newVisuals) { visuals = newVisuals; }
    this.setDuration = function(newDuration) { duration = newDuration; }
    this.setTransforms = function(newTransforms) { transforms = newTransforms; }

    this.getVisualsIterator = function() { return new Iterator(visuals); }
    this.getTransformsIterator = function() { return new Iterator(transforms); }
};

var SlideTransform = function(type, tmin, durate, mat) {
    var self = this;
    self.tMin = tmin;
    self.duration = durate;
    self.matrix = mat;

    this.getTMin = function() { return self.tMin; }
    this.getDuration = function() { return self.duration; }
    this.getMatrix = function() { return self.matrix; }
    this.setTMin = function(newTMin) { self.tMin = newTMin; }
    this.setDuration = function(newDuration) { self.duration = newDuration; }
    this.setMatrix = function(newMatrix) { self.matrix = newMatrix; }
};


///////////////////////////////////////////////////////////////////////////////
// Visual Elements
//
// The different types of visual elements.
///////////////////////////////////////////////////////////////////////////////

var VisualTypes = {
    basic: "Basic",
    stroke: "Stroke",
    dot: "Dot",
    img: "IMG"
};

var VisualTransformTypes = {
    Resize: "Resize", 
    Move: "Move",
    Property: "Property"
};

var BasicVisual = function(tmin, props) {
    //could alternatively take in an object of properties    
    var self = this;
    self.type = VisualTypes.basic;
    self.hyperlink = null;
    self.tDeletion = null;
    self.propertyTransforms = [];
    self.spatialTransforms = [];
    self.tMin = tmin;
    self.properties = props;

    this.getType = function() { return self.type; }
    this.getHyperlink = function() { return self.hyperlink; }
    this.getTDeletion = function() { return self.tDeletion; }
    this.getPropertyTransforms = function() { return self.propertyTransforms; }
    this.getSpatialTransforms = function() { return self.spatialTransforms; }
    this.getTMin = function() { return self.tMin; }
    this.getProperties = function() { return self.properties; }

    this.setType = function(newType) { self.type = newType; }
    this.setHyperlink = function(newHyperlink) { self.hyperlink = newHyperlink; }
    this.setTDeletion = function(newTDeletion) { self.tDeletion = newTDeletion; }
    this.setPropertyTransforms = function(newTransforms) { self.propertyTransforms = newTransforms; }
    this.setSpatialTransforms = function(newTransforms) { self.spatialTransforms = newTransforms; }
    this.setTMin = function(newTMin) { self.tMin = newTMin; }
    this.setProperties = function(newProperties) { self.properties = newProperties; }

    this.getPropertyTransformsIterator = function() { return new Iterator(self.propertyTransforms); }
    this.getSpatialTransformsIterator = function() { return new Iterator(self.spatialTransforms); }
};
BasicVisual.prototype.constructor = BasicVisual;
BasicVisual.prototype.getClone = function() {
    var copy = new this.constructor(this.getTMin(), this.getProperties().getClone());
    copy.setType(this.getType());
    copy.setHyperlink(this.getHyperlink());
    copy.setTDeletion(this.getTDeletion());
    copy.setTMin(this.getTMin());
    copy.setProperties(this.getProperties().getClone());
    var propertyTransformsCopy = [];
    var propertyTransformsIter = this.getPropertyTransformsIterator();
    while(propertyTransformsIter.hasNext()) {
        propertyTransformsCopy.push(propertyTransformsIter.next().getClone());
    }
    copy.setPropertyTransforms(propertyTransformsCopy);
    var spatialTransformsCopy = [];
    var spatialTransformsIter = this.getSpatialTransformsIterator();
    while(spatialTransformsIter.hasNext()) {
        spatialTransformsCopy.push(spatialTransformsIter.next().getClone());
    }
    copy.setSpatialTransforms(spatialTransformsCopy);
    return copy;
};

var StrokeVisual = function(tmin, props) {
    BasicVisual.prototype.constructor.call(this, tmin, props);
    this.setType(VisualTypes.stroke);
    var self = this;
    self.vertices = [];
    
    this.getVertices = function() { return self.vertices; }
    this.setVertices = function(newVertices) { self.vertices = newVertices; }
    this.getVerticesIterator = function() { return new Iterator(self.vertices); } //for Richard
}
StrokeVisual.prototype = new BasicVisual();
StrokeVisual.prototype.constructor = StrokeVisual;
StrokeVisual.prototype.getClone = function() {
    //does not copy properties yet!
    var copy = BasicVisual.prototype.getClone.call(this); //StrokeVisual.prototype.getClone.call(this) is also valid
    var verticesCopy = [];
    var vertIter = this.getVerticesIterator();
    while(vertIter.hasNext()) {
        verticesCopy.push(vertIter.next().getClone());
    }
    copy.setVertices(verticesCopy);
    return copy;
}



var VisualProperty = function(c, w) {
    var self = this;
    self.color, self.width;
    if (c==undefined)   { self.color = null; }
    else                { self.color = c; }
    if (w==undefined)   { self.width = null; }
    else                { self.width = w; }

    this.getColor = function() { return self.color; }
    this.setColor = function(newColor) { self.color = newColor; }
    this.getWidth = function() { return self.width; }
    this.setWidth  = function(newWidth) { self.width = newWidth; }
};
VisualProperty.prototype.getClone = function() {
    return new VisualProperty(this.getColor(), this.getWidth());
};

var VisualPropertyTransform = function(prop, newVal, time) {
    var self = this;
    self.property = prop;
    self.value = newVal;
    self.duration = 0;
    self.t = time;

    this.getProperty = function() { return self.property; }
    //no setter for the property, users should instead just create a new transform for a different property
    this.getValue = function() { return self.value; }
    this.setValue = function(newVal) { self.value = newVal; }
    this.getDuration = function() { return self.duration; }
    this.setDuration = function(newDuration) { self.duration = newDuration; }
    this.getTime = function() { return self.t; }
    this.setTime = function(newTime) { self.t = newTime; }
};
VisualPropertyTransform.prototype.getClone = function() {
    var copy = new VisualPropertyTransform(this.getProperty(), this.getValue());
    copy.getDuration(this.getDuration());
    return copy;
};

var VisualSpatialTransform = function(mat, time) {
    var self = this;
    self.matrix = mat;
    self.duration = 0;
    self.t = time;

    this.getMatrix = function() { return self.matrix; }
    this.setMatrix = function(newMatrix) { self.matrix = newMatrix; }
    this.getDuration = function() { return self.duration; }
    this.setDuration = function(newDuration) { self.duration = newDuration; }
    this.getTime = function() { return self.time; }
    this.setTime = function(newTime) { self.t = newTime; }
};
VisualSpatialTransform.prototype.getClone = function() {
    var copy = new VisualSpatialTransform(this.getMatrix());
    copy.setDuration(this.getDuration());
    return copy;
};


//could potentially migrate a vertex to have a tMin and a tDeletion
var Vertex = function(myX, myY, myT, myP) {
    var self = this;
    self.x = myX;
    self.y = myY;
    self.t = myT;
    self.p = myP;

    this.getX = function() { return self.x; }
    this.getY = function() { return self.y; }
    this.getT = function() { return self.t; }
    this.getP = function() { return self.p; }

    this.setX = function(newX) { self.x = newX; }
    this.setY = function(newY) { self.y = newY; }
    this.setT = function(newT) { self.t = newT; }
    this.setP = function(newP) { self.p = newP; }    
};
Vertex.prototype.getClone = function() {
    return new Vertex(this.getX(), this.getY(), this.getT(), this.getP());
};

var Segment = function(a, b, props) {
    var self = this;
    self.from = a;
    self.to = b;
    self.properties = props;

    this.getFromPoint = function() { return self.from; }
    this.getToPoint = function() { return self.to; }
    this.getProperties = function() { return self.properties; }

    this.setFromPoint = function(newFrom) { self.from = newFrom; }
    this.setToPoint = function(newTo) { self.to = newTo; }
    this.setProperties = function(newProperties) { self.properties = newProperties; }
};

//The semantic is that visuals are visible exactly ON their tMin, not later
//Therefore, when time hits tMin, the visual is visible
//Likewise, visuals are deleted ON their tDeletion, not later
//Therefore, when time his tDeletion, the visual is no longer visible
var isVisualVisible = function(visual, tVisual) {
    if(visual.getTMin() > tVisual) { return false; }
    if(visual.getTDeletion() != null && visual.getTDeletion() <= tVisual) { return false; }

    return true;
};

//The semantic is the same as that for a visual, a vertex is visible ON its t value
//This function can be modified if we decide to later support erasure
var isVertexVisible = function(vertex, tVisual) {
    if(vertex.getT() > tVisual) { return false; }

    return true;
};
