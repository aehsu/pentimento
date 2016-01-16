///////////////////////////////////////////////////////////////////////////////
// Visuals Model
//
// The visuals model consists of slides.
///////////////////////////////////////////////////////////////////////////////
"use strict";

var VisualsModel = function(canvas_width, canvas_height) {

    var self = this;        
    var slides = [ new Slide() ];  // Setup the visuals with one slide
    var canvasWidth = canvas_width;
    var canvasHeight = canvas_height;

    // Gets the size of the canvas where the visuals are being recorded
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

    this.setSlides = function(slides_) {
        slides = slides_;
    };

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
        
        if (time >= tSlideStart && time < tSlideEnd) {
            return slide;
        }
        
        for (var i = 1; i < slides.length; i++) {
            slide = slides[i];
            tSlideStart = tSlideEnd;
            tSlideEnd += slide.getDuration();
            
            if (time >= tSlideStart && time < tSlideEnd) {
                return slide;
            }
        }
        
        return slides[slides.length - 1];
    }
    
    this.getIndexOfSlide = function(slide) {
        return slides.indexOf(slide);
    }

    this.getSlideBeginTime = function(slide) {
        var index = self.getIndexOfSlide(slide);
        var slideBeginTime = 0;
        for (var i = 0; i < index; i++) {
            slideBeginTime += slide.getDuration();
        }
        return slideBeginTime;
    }
    
    this.insertSlide = function(newSlide, insert_index) {
        if (typeof insert_index === 'undefined') {
            insert_index = slides.length;
        }

        if (insert_index < 0 || insert_index > slides.length) {
            console.error('slides insert index invalid');
            return false;
        }

        slides.splice(insert_index, 0, newSlide);

        undoManager.registerUndoAction(self, self.removeSlide, [newSlide]);

        return true;
    };

    this.removeSlide = function(slide) {
        if (slides.length == 1) {
            console.error("Only one slide left, cannot delete!");
            return false;
        }
        var index = slides.indexOf(slide);
        if (index == -1) { 
            console.error("slide does not exist");
            return false;
        };

        slides.splice(index, 1);

        undoManager.registerUndoAction(self, self.insertSlide, [slide, index]);

        return true;
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Visuals
    ///////////////////////////////////////////////////////////////////////////////

    this.addVisuals = function(visuals) {

        for(var i in visuals) {
            var visual = visuals[i];
            var slide = self.getSlideAtTime(visual.getTMin());
            slide.getVisuals().push(visual);
        };

        undoManager.registerUndoAction(self, self.deleteVisuals, [visuals]);
    };

    this.deleteVisuals = function(visuals) {

        for(var i in visuals) {
            var visual = visuals[i];
            var slide = self.getSlideAtTime(visual.getTMin());

            var index = slide.getVisuals().indexOf(visual);
            if (index < 0) {
                console.error('visual not found')
                return;
            };

            slide.getVisuals().splice(index, 1);
        };

        undoManager.registerUndoAction(self, self.addVisuals, [visuals]);
    };

    // Visuals time can be null to indicate the lack of a deletion time
    this.visualsSetTDeletion = function(visual, visuals_time) {

        undoManager.beginGrouping();

        for(var i in self.selection) {
            var visual = self.selection[i];
            undoManager.registerUndoAction(visual, visual.setTDeletion, [visual.getTDeletion()]);
            visual.setTDeletion(visuals_time);
        };

        undoManager.endGrouping();
    };

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

    this.saveToJSON = function() {
        var json_object = {
            slides: [],
            canvas_width: canvasWidth,
            canvas_height: canvasHeight
        };
        
        var slides = self.getSlidesIterator();
        while(slides.hasNext()) {
            var slide_json = slides.next().saveToJSON();
            json_object['slides'].push(slide_json);
        };

        return json_object;
    };
};
VisualsModel.loadFromJSON = function(json_object) {
    var visuals_model = new VisualsModel(json_object['canvas_width'], json_object['canvas_height']);

    var json_slides = json_object['slides'];
    var slides = [];
    for (var i = 0; i < json_slides.length; i++) {
        slides.push(Slide.loadFromJSON(json_slides[i]))
    };
    visuals_model.setSlides(slides);

    return visuals_model;
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
    var self = this;
    var visuals = [];
    var duration = 0;  // milliseconds integer
    
    this.getVisuals = function() { return visuals; }
    this.getDuration = function() { return duration; }
    this.setVisuals = function(newVisuals) { visuals = newVisuals; }

    this.setDuration = function(newDuration) {
        undoManager.registerUndoAction(self, self.setDuration, [duration]);
        duration = newDuration;
    }

    this.getVisualsIterator = function() { return new Iterator(visuals); }

    this.saveToJSON = function() {
        var json_object = {
            visuals: [],
            duration: duration
        };

        for (var i = 0; i < visuals.length; i++) {
            json_object['visuals'].push(visuals[i].saveToJSON());
        };

        return json_object;
    };
};
Slide.loadFromJSON = function(json_object) {
    var slide = new Slide();

    var json_visuals = json_object['visuals'];
    var visuals = [];
    for (var i = 0; i < json_visuals.length; i++) {
        visuals.push(Visual.loadFromJSON(json_visuals[i]))
    };
    slide.setVisuals(visuals);

    slide.setDuration(json_object['duration']);

    return slide;
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
    var tMin = TimeManager.getVisualInstance().getAndRegisterTimeInstance(tmin);
    var properties = props;

    this.getType = function() { return type; }
    this.getHyperlink = function() { return hyperlink; }
    this.getTDeletion = function() { return tDeletion ? tDeletion.get() : null; }
    this.getPropertyTransforms = function() { return propertyTransforms; }
    this.getSpatialTransforms = function() { return spatialTransforms; }
    this.getTMin = function() { return tMin.get(); }
    this.getProperties = function() { return properties; }

    this.setType = function(newType) { type = newType; }
    this.setHyperlink = function(newHyperlink) { hyperlink = newHyperlink; }
    this.setTDeletion = function(newTDeletion) {
        if (tDeletion)
            tDeletion.set(newTDeletion);
        else
            tDeletion = TimeManager.getVisualInstance().getAndRegisterTimeInstance(newTDeletion);
    }
    this.setPropertyTransforms = function(newTransforms) { propertyTransforms = newTransforms; }
    this.setSpatialTransforms = function(newTransforms) { spatialTransforms = newTransforms; }
    this.setTMin = function(newTMin) { tMin.set(newTMin); }
    this.setProperties = function(newProperties) { properties = newProperties; }

    this.getPropertyTransformsIterator = function() { return new Iterator(propertyTransforms); }
    this.getSpatialTransformsIterator = function() { return new Iterator(spatialTransforms); }

    // Apply a spatial transform to the visual through all points in time.
    // This is different from pushing a transform, which only applies it at the specified time.
    // The transform is a math.js matrix.
    // This method needs to be overridden by child classes.
    this.applySpatialTransform = function(transform) {
        console.error('Visual.applySpatialTransform() needs to be overridden by child class');
        return;
    };

    // Push a spatial transform that has a time when it becomes active.
    // This inserts the transform into the spatial transforms array so that 
    // the transforms are ordered by time.
    // The transform matrix is stored as row-major matrix (an array of arrays):
    // [[1,2,3], [4,5,6], [7,8,9]]
    this.pushSpatialTransform = function(transform) {
        var insert_index = 0;
        for (var i = 0; i < spatialTransforms.length; i++) {
            if (transform.getTime() < spatialTransforms[i].getTime()) {
                break;
            };
            insert_index = i + 1;
        };
        spatialTransforms.splice(insert_index, 0, transform);

        undoManager.registerUndoAction(self, self.removeSpatialTransform, [transform.getTime()]);
    };

    // Remove the spatial transform that is active at the specified time
    this.removeSpatialTransform = function(time) {
        // TODO

        undoManager.registerUndoAction(self, self.pushSpatialTransform, [transform]);
    };

    // Returns the spatial transform at the given time (non-interpolated)
    // The active one has a time just less than or equal to the specified time.
    // Return the identity transform if there are no transforms active yet.
    this.spatialTransformAtTime = function(time) {

        // Get the index that should be used to indicate which matrix is active.
        // It is 1 more than the index because the identity is technically the first transform.
        var return_index = 0;
        for (var i = 0; i < spatialTransforms.length; i++) {
            if (time < spatialTransforms[i].getTime()) {
                break;
            };
            return_index = i + 1;
        };

        if (return_index === 0) {
            // When the return index is 0, that means there are no transforms active,
            // so just return the identity at time 0. 
            return new VisualSpatialTransform(math.eye(3).valueOf(), 0);
        } else {
            // Subtract 1 from the index because the identity matrix counts as the first matrix
            return spatialTransforms[return_index-1];
        };
    };

    // Change the properties of the visual through all points in time.
    // This is different from pushing a transform, which only applies it at the specified time.
    this.applyPropertyTransform = function(property_name, new_value) {

        var old_value;
        switch (property_name) {
            case 'color':
                old_value = properties.getColor();
                properties.setColor(new_value);
                break;
            case 'width':
                old_value = properties.getWidth();
                properties.setWidth(new_value);
                break;
            default:
                console.error('invalid property name: ' + property_name);
                return;
        }

        undoManager.registerUndoAction(self, self.applyPropertyTransform, [property_name, old_value]);
    };

    // Push a property transform that has a time when it becomes active.
    // This inserts the property into the property transforms array so that they are ordered by time.
    this.pushPropertyTransform = function(transform) {
        var insert_index = 0;
        for (var i = 0; i < propertyTransforms.length; i++) {
            if (transform.getTime() < propertyTransforms[i].getTime()) {
                break;
            };
            insert_index = i + 1;
        };
        propertyTransforms.splice(insert_index, 0, transform);
    };

    // Remove the property transform that is active at the specified time
    this.removePropertyTransform = function(time) {
        // TODO

                // Get the index that should be used to indicate which matrix is active.
        // It is 1 more than the index because the identity is technically the first transform.
        var return_index = 0;
        for (var i = 0; i < spatialTransforms.length; i++) {
            if (time < spatialTransforms[i].getTime()) {
                break;
            };
            return_index = i + 1;
        };

        if (return_index === 0) {
            // When the return index is 0, that means there are no transforms active,
            // so just return the identity at time 0. 
            return new VisualSpatialTransform(math.eye(3).valueOf(), 0);
        } else {
            // Subtract 1 from the index because the identity matrix counts as the first matrix
            return spatialTransforms[return_index-1];
        };

        undoManager.registerUndoAction(self, self.pushPropertyTransform, [transform]);
    };

    // Returns the properties at the given time (non-interpolated)
    this.getPropertiesAtTime = function(time) {
        
        var result = new VisualProperty(properties.getColor(), properties.getWidth());

        // Apply all property transforms until time.
        for (var i = 0; i < propertyTransforms.length; i++) {
            var propertyTransform = propertyTransforms[i];
            
            if (propertyTransform.getTime() < time) {
                switch (propertyTransform.getPropertyName()) {
                    case VisualPropertyTransform.propertyNames.color:
                        result.setColor(propertyTransform.getValue());
                        break;
                    case VisualPropertyTransform.propertyNames.width:
                        result.setWidth(propertyTransform.getValue());
                        break;
                }
            } else {
                break;
            }
        };

        return result;
    };

    // The rule is that visuals are visible exactly ON their tMin, not later
    // Therefore, when time hits tMin, the visual is visible
    // Likewise, visuals are deleted ON their tDeletion, not later
    // Therefore, when time his tDeletion, the visual is no longer visible
    this.isVisible = function(tVisual) {
        if (tMin.get() > tVisual) {
            return false;
        }
        if (tDeletion != null && tDeletion.get() <= tVisual) {
            return false;
        }
        return true;
    };
};
// Set the method in the prototype so child classes can inherit from it
Visual.prototype.saveToJSON = function() {
    var json_object = {
        type: this.getType(),
        hyperlink: this.getHyperlink(),
        tDeletion: this.getTDeletion(),
        propertyTransforms: [],
        spatialTransforms: [],
        tMin: this.getTMin(),
        properties: this.getProperties().saveToJSON()
    };

    var property_transforms = this.getPropertyTransforms();
    for (var i = 0; i < property_transforms.length; i++) {
        json_object.propertyTransforms.push(property_transforms[i].saveToJSON());
    };

    var spatial_transforms = this.getSpatialTransforms();
    for (var i = 0; i < spatial_transforms.length; i++) {
        json_object.spatialTransforms.push(spatial_transforms[i].saveToJSON());
    };

    return json_object;
};
Visual.loadFromJSON = function(json_object) {

    var new_visual = null;

    // Initialize the child part
    switch (json_object['type']) {
        case VisualTypes.stroke:
            new_visual = StrokeVisual.loadFromJSON(json_object);
            break;
        case VisualTypes.dot:
            // TODO
            break;
        case VisualTypes.img:
            // TODO
            break;
        default:
            console.error('unrecognized type: '+json_object['type']);
    };

    if (!new_visual) {
        console.error('no visual loaded from JSON');
    };

    // Load the parent part (don't need to set type, tMin, properties)
    new_visual.setHyperlink(json_object['hyperlink']);
    new_visual.setTDeletion(json_object['tDeletion']);

    var property_transforms = [];
    for (var i = 0; i < json_object['propertyTransforms'].length; i++) {
        property_transforms.push(VisualPropertyTransform.loadFromJSON(json_object['propertyTransforms'][i]))
    };
    new_visual.setPropertyTransforms(property_transforms);

    var spatial_transforms = [];
    for (var i = 0; i < json_object['spatialTransforms'].length; i++) {
        spatial_transforms.push(VisualSpatialTransform.loadFromJSON(json_object['spatialTransforms'][i]))
    };
    new_visual.setSpatialTransforms(spatial_transforms);

    return new_visual;
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

    // Overrides the parent applyTransform()
    // Applies the transform to all the vertices in the stroke.
    this.applySpatialTransform = function(transformMatrix) {
        for (var i = 0; i < vertices.length; i++) {
            var vertexArray = [ vertices[i].getX(), vertices[i].getY(), 1 ];
            var resultVertexArray = math.multiply(transformMatrix, vertexArray).valueOf();
            vertices[i].setX(resultVertexArray[0]);
            vertices[i].setY(resultVertexArray[1]);
        };

        // For the undo operation, apply the inverse transform
        undoManager.registerUndoAction(self, self.applySpatialTransform, [math.inv(transformMatrix)]);
    };

    // Saving the model to JSON
    this.saveToJSON = function() {

        // Call parent method
        var json_object = Visual.prototype.saveToJSON.call(self);

        // Add the fields belonging to the child object
        json_object['vertices'] = [];

        // Iterate over vertices and add them to the JSON 
        for (var i = 0; i < vertices.length; i++) {
            json_object['vertices'].push(vertices[i].saveToJSON());
        };

        return json_object;
    };
};
StrokeVisual.loadFromJSON = function(json_object) {

    // Load the child class attributes only
    var stroke_visual = new StrokeVisual(json_object['tMin'], VisualProperty.loadFromJSON(json_object['properties']));

    // Add the vertices
    var json_verticies = json_object['vertices'];
    var vertices = [];
    for (var i = 0; i < json_verticies.length; i++) {
        vertices.push(Vertex.loadFromJSON(json_verticies[i]))
    };
    stroke_visual.setVertices(vertices);

    return stroke_visual;
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
    this.setWidth  = function(newWidth) { width = newWidth; }

    // Saving the model to JSON
    this.saveToJSON = function() {
        var json_object = {
            c: color,
            w: width
        };

        return json_object;
    };
};
VisualProperty.loadFromJSON = function(json_object) {
    return new VisualProperty(json_object.c, json_object.w);
};

var VisualPropertyTransform = function(property_name, new_val, time) {
    var self = this;
    var propertyName = property_name;
    var value = new_val;
    var t = TimeManager.getVisualInstance().getAndRegisterTimeInstance(time);

    //no setter for the property, users should instead just create a new transform for a different property
    this.getPropertyName = function() { return propertyName; }
    this.getValue = function() { return value; }
    this.getTime = function() { return t.get(); }

    // Saving the model to JSON
    this.saveToJSON = function() {
        var json_object = {
            property_name: propertyName,
            value: value,
            t: t.get()
        };

        return json_object;
    };
};
VisualPropertyTransform.loadFromJSON = function(json_object) {
    var visualPropertyTransform = new VisualPropertyTransform(VisualProperty.loadFromJSON(json_object['property_name']), json_object['value'],
                                                                json_object['t']);
    return visualPropertyTransform;
};
VisualPropertyTransform.propertyNames = { 
    color: 'color', 
    width: 'width'
};


var VisualSpatialTransform = function(mat, time) {
    var self = this;
    var matrix = mat;  // math.js matrix
    var t = TimeManager.getVisualInstance().getAndRegisterTimeInstance(time);

    this.getMatrix = function() { return matrix; }
    this.setMatrix = function(newMatrix) { matrix = newMatrix; }
    this.getTime = function() { return t.get(); }
    this.setTime = function(newTime) { t.set(newTime); }

    // Saving the model to JSON
    this.saveToJSON = function() {
        var json_object = {
            matrix: matrix,
            t: t.get()
        };

        return json_object;
    };
};
VisualSpatialTransform.loadFromJSON = function(json_object) {
    var visualSpatialTransform = new VisualSpatialTransform(json_object['matrix'], json_object['t']);
    return visualSpatialTransform;
};

///////////////////////////////////////////////////////////////////////////////
// Visual properties and transforms
///////////////////////////////////////////////////////////////////////////////

//could potentially migrate a vertex to have a tMin and a tDeletion
var Vertex = function(myX, myY, myT, myP) {
    var self = this;
    var x = myX;
    var y = myY;
    var t = TimeManager.getVisualInstance().getAndRegisterTimeInstance(myT);
    var p = myP;

    this.getX = function() { return x; }
    this.getY = function() { return y; }
    this.getT = function() { return t.get(); }
    this.getP = function() { return p; }

    this.setX = function(newX) { x = newX; }
    this.setY = function(newY) { y = newY; }
    this.setT = function(newT) { t.set(newT); }
    this.setP = function(newP) { p = newP; }    

    // Returns a boolean indicating whether the vertex is visible at the given time
    this.isVisible = function(tVisual) {
        return t.get() <= tVisual;
    };

    // Saving the model to JSON
    this.saveToJSON = function() {
        var json_object = {
            x: x,
            y: y,
            t: t.get(),
            p: p
        };

        return json_object;
    };
};
Vertex.loadFromJSON = function(json_object) {
    return new Vertex(json_object.x, json_object.y, json_object.t, json_object.p);
};

