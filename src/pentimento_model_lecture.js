/*************************************************
					MODEL
*************************************************/
function Slide() {
    this.visuals = [];
    this.duration = 0;
    
    this.access = function() {
        var self = this;
        
        return {
            visuals: function() { return new Iterator(self.visuals); },
            duration: function() { return self.duration; }
        };
    };
};

ConstraintTypes = {
	Manual: "Manual",
	Automatic: "Automatic"
}

function Constraint() {
    this.tVis;
    this.tAud;
    this.type;
}

function Matrix() {
    //TODO
}

function Transform() {
    this.tMin;
    this.duration; //for animations
    this.matrix;
}

function Lecture() {
    this.slides = [];
    this.audioTracks = [];
    this.constraints = [];
    this.transforms = [];
    
    this.access = function() {
        var self = this;
//        var slide_accessors = [];
//        for(var sli in self.slides) { slide_accessors.push(self.slides[sli].access()); }
        return {
            slides: function() { return new Iterator(self.slides); },
            constraints: function() { return new Iterator(self.constraints); }
            //audio
        };
    };
};