//enum for the different types of visuals
var VisualTypes = {
    basic: "Basic",
    stroke: "Stroke",
    dot: "Dot",
    img: "IMG"
};

function VisualProperties(c, w) {
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

function VisualTransform(tmin, durate, mat) {
    var tMin = tmin;
    var duration = durate;
    var matrix = mat;

    this.getTMin = function() { return tMin; }
    this.getDuration = function() { return duration; }
    this.getMatrix = function() { return matrix; }
    this.setTMin = function(newTMin) { tMin = newTMin; }
    this.setDuration = function(newDuration) { duration = newDuration; }
    this.setMatrix = function(newMatrix) { matrix = newMatrix; }
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

function BasicVisual(tmin, props) {
    //could alternatively take in an object of properties    
    var self = this;
    self.type = VisualTypes.basic;
    self.hyperlink = null;
    self.tDeletion = null;
    self.transforms = [];
    self.tMin = tmin;
    self.properties = props;

    this.getType = function() { return self.type; }
    this.getHyperlink = function() { return self.hyperlink; }
    this.getTDeletion = function() { return self.tDeletion; }
    this.getTransforms = function() { return self.transforms; }
    this.getTMin = function() { return self.tMin; }
    this.getProperties = function() { return self.properties; }

    this.setType = function(newType) { self.type = newType; }
    this.setHyperlink = function(newHyperlink) { self.hyperlink = newHyperlink; }
    this.setTDeletion = function(newTDeletion) { self.tDeletion = newTDeletion; }
    this.setTransforms = function(newTransforms) { self.transforms = newTransforms; }
    this.setTMin = function(newTMin) { self.tMin = newTMin; }
    this.setProperties = function(newProperties) { self.properties = newProperties; }
}

BasicVisual.prototype.getClone = function() {
    var copy = BasicVisual.constructor();
    for(var attr in this) {
        if(this[attr] instanceof Object) {
            var attrCopy;
            for(var subattr in this[attr]) {
                if ('getClone' in this[attr][subattr]) {
                    attrCopy = this[attr][subattr].getClone();
                } else {
                    attrCopy = this[attr][subattr];
                }
            }
            copy[attr] = attrCopy;
        } else {
            copy[this] = this[attr];
        }
    }
    return copy;
}

function StrokeVisual(tmin, props) {
    BasicVisual.call(this, tmin, props);
    this.setType(VisualTypes.stroke);
    var self = this;
    self.vertices = [];
    
    this.getVertices = function() { return self.vertices; }
    this.setVertices = function(newVertices) { self.vertices = newVertices; }
    this.getVerticesIterator = function() { return new Iterator(self.vertices); } //for Richard
}
StrokeVisual.prototype = new BasicVisual();
StrokeVisual.prototype.constructor = StrokeVisual;

//more visuals declarations