//enum for the different types of visuals
var VisualTypes = {
    basic: "Basic",
    stroke: "Stroke",
    dot: "Dot",
    img: "IMG"
};

function Vertex(x, y, t, p) {
    this.x = x;
    this.y = y;
    this.t = t;
    this.p = p;
}

Vertex.prototype.access = function() {
    var self = this;
    return {
        x: function() { return self.x; },
        y: function() { return self.y; },
        t: function() { return self.t; },
        p: function() { return self.p; }
    }
}

function Segment(a, b, props) {
    return {
        from: a, 
        to: b,
        properties: props
    }
}

function BasicVisual(tMin) {
    //could alternatively take in an object of properties    
    this.tMin = tMin;
    this.hyperlink;
    this.type = VisualTypes.basic;
    this.doesItGetDeleted;
    this.tEndEdit;
    this.properties = {};
    this.transforms = {};
}

BasicVisual.prototype.access = function() {
    var self = this; //refer to the object itself, not this function
    return {
        tMin: function() { return self.tMin; },
        hyperlink: function() { return self.hyperlink; },
        type: function() { return self.type; },
        doesItGetDeleted: function() { return self.doesItGetDeleted; },
        tEndEdit: function() { return self.tEndEdit; },
        properties: function() { return self.properties; },
        transforms: function() { return self.transforms; }
    }
}

function StrokeVisual(tMin) {
    this.tMin = tMin;
    this.hyperlink;
    this.type = VisualTypes.stroke;
    this.vertices = [];
    this.doesItGetDeleted;
    this.tEndEdit;
    this.properties = {};
    this.transforms = {};
}

StrokeVisual.prototype = new BasicVisual();
StrokeVisual.prototype.constructor = StrokeVisual; //optional until you make a constructor call
StrokeVisual.prototype.access = function() {
    var self = this;
    var _super = BasicVisual.prototype.access.call(self);
    //we can put the get_vertices from Richard's code here if we really want to limit what access you get
    _super.vertices = function() { return self.vertices; }
    return _super;
}

function DotsVisual(tMin) {
    this.tMin = tMin;
    this.hyperlink;
    this.type = VisualTypes.dot;
    this.vertices = [];
    this.doesItGetDeleted;
    this.tEndEdit;
    this.properties = {};
    this.transforms = {};
}

DotsVisual.prototype = new BasicVisual();
DotsVisual.prototype.constructor = DotsVisual; //optional until you make a constructor call
DotsVisual.prototype.access = function() {
    var self = this;
    var _super = BasicVisual.prototype.access.call(self);
    //we can put the get_vertices from Richard's code here if we really want to limit what access you get
    _super.vertices = function() { return self.vertices; }
    return _super;
}

//more visuals declarations