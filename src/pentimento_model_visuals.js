//enum for the different types of visuals
var VisualTypes = {
    basic: "Basic",
    stroke: "Stroke",
    dot: "Dot",
    img: "IMG"
};

function Vertex(myX, myY, myT, myP) {
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
}

function Segment(a, b, props) {
    var from = a;
    var to = b;
    var properties = props;

    this.getFromPoint = function() { return from; }
    this.getToPoint = function() { return to; }
    this.getProperties = function() { return properties; }

    this.setFromPoint = function(newFrom) { from = newFrom; }
    this.setToPoint = function(newTo) { to = newTo; }
    this.setProperties = function(newProperties) { properties = newProperties; }
}

function BasicVisual(tmin, props) {
    //could alternatively take in an object of properties    
    var type = VisualTypes.basic;
    var hyperlink = null;
    var tDeletion = null;
    var transforms = [];
    var tMin = tmin;
    var properties = props;
    //this.doesItGetDeleted;
    // this.tEndEdit = null; not necessary

    this.getType = function() { return type; }
    this.getHyperlink = function() { return hyperlink; }
    this.getTDeletion = function() { return tDeletion; }
    this.getTransforms = function() { return transforms; }
    this.getTMin = function() { return tMin; }
    this.getProperties = function() { return properties; }

    this.setType = function(newType) { type = newType; }
    this.setHyperlink = function(newHyperlink) { hyperlink = newHyperlink; }
    this.setTDeletion = function(newTDeletion) { tDeletion = newTDeletion; }
    this.setTransforms = function(newTransforms) { transforms = newTransforms; }
    this.setTMin = function(newTMin) { tMin = newTMin; }
    this.setProperties = function(newProperties) { properties = newProperties; }
}

function StrokeVisual(tmin, props) {
    BasicVisual.call(this, tmin, props);
    this.setType(VisualTypes.stroke);
    var vertices = [];
    
    this.getVertices = function() { return vertices; }
    this.setVertices = function(newVertices) { vertices = newVertices; }
    this.getVerticesIterator = function() { return new Iterator(vertices); } //for Richard
}
StrokeVisual.prototype = new BasicVisual();
StrokeVisual.prototype.constructor = StrokeVisual; //optional until you make a constructor call

//more visuals declarations