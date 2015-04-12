///////////////////////////////////////////////////////////////////////////////
// Visuals Model
//
// The visuals model consists of slides.
///////////////////////////////////////////////////////////////////////////////
"use strict";

var VisualsModel = function() {

    var self = this;
    var slides = [];
    var canvasWidth = 900;
    var canvasHeight = 500;

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

    this.getSlides = function() {
        return slides;
    };

    this.getSlidesIterator = function() {
        return new Iterator(slides);
    }
    
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
    var type = VisualTypes.basic;
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
    var vertices = [];
    
    this.getVertices = function() { return vertices; }
    this.setVertices = function(newVertices) { vertices = newVertices; }
    this.getVerticesIterator = function() { return new Iterator(vertices); } //for Richard
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
    var color;
    var width;
    if (c==undefined)   { color = null; }
    else                { color = c; }
    if (w==undefined)   { width = null; }
    else                { width = w; }

    this.getColor = function() { return color; }
    this.setColor = function(newColor) { color = newColor; }
    this.getWidth = function() { return width; }
    this.setWidth  = function(newWidth) { width = Math.round(newWidth); }
};
VisualProperty.prototype.getClone = function() {
    return new VisualProperty(this.getColor(), this.getWidth());
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
VisualPropertyTransform.prototype.getClone = function() {
    var copy = new VisualPropertyTransform(this.getProperty(), this.getValue());
    copy.getDuration(this.getDuration());
    return copy;
};

var VisualSpatialTransform = function(mat, time) {
    var self = this;
    var matrix = mat;
    var duration = 0;
    var t = time;

    this.getMatrix = function() { return matrix; }
    this.setMatrix = function(newMatrix) { matrix = newMatrix; }
    this.getDuration = function() { return duration; }
    this.setDuration = function(newDuration) { duration = Math.round(newDuration); }
    this.getTime = function() { return time; }
    this.setTime = function(newTime) { t = Math.round(newTime); }
};
VisualSpatialTransform.prototype.getClone = function() {
    var copy = new VisualSpatialTransform(this.getMatrix());
    copy.setDuration(this.getDuration());
    return copy;
};


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
};
Vertex.prototype.getClone = function() {
    return new Vertex(this.getX(), this.getY(), this.getT(), this.getP());
};

var Segment = function(a, b, props) {
    var self = this;
    var from = a;
    var to = b;
    var properties = props;

    this.getFromPoint = function() { return from; }
    this.getToPoint = function() { return to; }
    this.getProperties = function() { return properties; }

    this.setFromPoint = function(newFrom) { from = newFrom; }
    this.setToPoint = function(newTo) { to = newTo; }
    this.setProperties = function(newProperties) { properties = newProperties; }
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
