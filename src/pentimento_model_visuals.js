//enum for the different types of visuals
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

function VisualProperty(c, w) {
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
}

VisualProperty.prototype.getClone = function() {
    return new VisualProperty(this.getColor(), this.getWidth());
}

function VisualPropertyTransform(prop, newVal, time) {
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
}

VisualPropertyTransform.prototype.getClone = function() {
    var copy = new VisualPropertyTransform(this.getProperty(), this.getValue());
    copy.getDuration(this.getDuration());
    return copy;
}

function VisualSpatialTransform(mat, time) {
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
}

VisualSpatialTransform.prototype.getClone = function() {
    var copy = new VisualSpatialTransform(this.getMatrix());
    copy.setDuration(this.getDuration());
    return copy;
}

//could potentially migrate a vertex to have a tMin and a tDeletion
function Vertex(myX, myY, myT, myP) {
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
}

Vertex.prototype.getClone = function() {
    return new Vertex(this.getX(), this.getY(), this.getT(), this.getP());
}

function Segment(a, b, props) {
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
}

//unnecessary
Segment.prototype.getClone = function() {
    return new Segment(this.getFromPoint().getClone(), this.getToPoint().getClone(), this.getProperties().getClone());
}

function BasicVisual(tmin, props) {
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
}

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
}

function StrokeVisual(tmin, props) {
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

//more visuals declarations