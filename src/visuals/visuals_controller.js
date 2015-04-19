//Because of integration with the undo manager, the undo actions should call updateVisuals()
//appropriately. Only the undo actions, though, not the forward actions! Therefore, any time
//um.add is called, it should have an updateVisuals inside of the function if necessary
"use strict";

var VisualsController = function(visuals_model, retimer_model) {
    var self = this;
    var visualsModel = null;
    var retimerModel = null;
    var toolsController = null;
    var renderer = null;

    // Variables used for keeping track of recording information
    var originSlide = null;
    var originSlideDuration = null;
    var slideBeginTime = NaN;

    // DOM elements
    var canvasID = 'sketchpad';
    var canvasOverlayID = 'sketchpadOverlay';  // Used for displaying HTML elements on top of the canvas
    this.canvas = null;
    this.canvasOverlay = null;

    this.currentVisual = null;
    this.selection = [];

    this.color = '#777';
    this.width = 2;

    this.getVisualsModel = function() {
        return visualsModel;
    };

    this.getRetimerModel = function() {
        return retimerModel;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Drawing of Visuals
    ///////////////////////////////////////////////////////////////////////////////

    // Callback function of updateTime.
    // Draws to the canvas through the renderer
    this.drawVisuals = function(time) {
        // Convert the audio time to visuals time
        var visualsTime = retimerModel.getVisualTime(time);

        // Render the canvas
        var context = self.canvas[0].getContext('2d')
        renderer.drawCanvas(self.canvas, context, 0, visualsTime);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Recording of Visuals
    //
    // Handlers for when recording begins and ends.
    // Includes helper functions for recording logic.
    // Informs the tools controller of changes in recording status.
    ///////////////////////////////////////////////////////////////////////////////

    this.startRecording = function(currentTime) {

        if (!visualsModel.getSlideAtTime(currentTime)) {
            console.error("there is no current slide");
            return;
        }

        self.selection  = [];

        // slideBeginTime starts as the visuals time that recording began
        slideBeginTime = retimerModel.getVisualTime(currentTime);

        // Keep the origin slides and set visuals dirty so we can shift the visuals in these slides when recording ends
        originSlide = visualsModel.getSlideAtTime(currentTime);
        originSlideDuration = originSlide.getDuration();
        visualsModel.setDirtyVisuals(slideBeginTime);

        // Signal the tools controller
        toolsController.startRecording();
    };

    this.stopRecording = function(currentTime) {
        self.selection  = [];

        var currentSlide = visualsModel.getSlideAtTime(currentTime);

        var slideRecordDuration = retimerModel.getVisualTime(currentTime) - slideBeginTime;
        currentSlide.setDuration(currentSlide.getDuration() + slideRecordDuration);

        // Restores the dirty visuals to their former places and adds a shift.
        visualsModel.cleanVisuals(originSlide.getDuration() - originSlideDuration);
        
        // Reset recording variables
        slideBeginTime = NaN;
        originSlide = null;
        originSlideDuration = null;

        // Signal the tools controller
        toolsController.stopRecording();
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Playback of Visuals
    //
    // Nothing needs to be done except letting the tools controller know
    ///////////////////////////////////////////////////////////////////////////////

    this.startPlayback = function(currentTime) {
        toolsController.startPlayback();
    };

    this.stopPlayback = function(currentTime) {
        toolsController.stopPlayback();
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Adding of Slides
    ///////////////////////////////////////////////////////////////////////////////

    this.addSlide = function() {

        // Get the difference in time for when the slide began recording to the current time
        var time = retimerModel.getVisualTime(lectureController.getTimeController().getTime());
        var diff = time - slideBeginTime;

        // Get the current slide and create a new slide
        var currentSlide = visualsModel.getSlideAtTime(slideBeginTime);

        var newSlide = new Slide();
        if (!currentSlide) { 
            console.error('currentSlide missing');
        };

        // Update the duration of the current slide to reflect the difference
        currentSlide.setDuration(currentSlide.getDuration() + diff);
        
        // Insert the slide into the model
        var result = visualsModel.insertSlide(currentSlide, newSlide);
        if (!result) {
            console.error("slide could not be inserted");
        };
    };

    // this.shiftSlideDuration = function(slide, amount) {
    //     slide.setDuration(slide.getDuration() + amount);
    // };
    
    // this.deleteSlide = function(slide) {

    //     // Delete the slide from the model
    //     var result = visualsModel.removeSlide();
    //     if (!result) {
    //         console.error("slide could not be deleted");
    //     };
        
    //     // Update the time cursor
    //     var duration = 0;
    //     var slideIter = visualsModel.getSlidesIterator();
    //     while(slideIter.hasNext()) {
    //         var sl = slideIter.next();
    //         if(slideIter.index == index) { break; }
    //         duration += sl.getDuration();
    //     }
    //     // TODO: use retimer for times
    //     var slideTime = pentimento.timeController.getTime() - duration;
    //     pentimento.timeController.updateTime(duration);
    // };

    ///////////////////////////////////////////////////////////////////////////////
    // Adding of Visuals
    ///////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////
    // Transforming of Visuals
    //
    // Typically during a recording, these are the handlers for transforms to be applied to visuals
    // Resizing or such actions are transformations which may happen during editing
    ///////////////////////////////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////////////////////////////
    // Editing of Visuals
    //
    // This section is primarily concerned with the direct editing of the properties of
    // a visual. Recording edits to a visual are transforms, which is in a later section
    ///////////////////////////////////////////////////////////////////////////////

    this.editWidth = function(visuals, newWidth) {
        var widthObjs = [];
        for(var i in visuals) {
            var visual = visuals[i];
            var widthObj = {};
            widthObj.widthTrans = [];
            widthObj.indices = [];
            widthObj.width  = visual.getProperties().getWidth();
            visual.getProperties().setWidth(newWidth);
            var propTrans = visual.getPropertyTransforms();
            for(var j in propTrans) {
                if(propTrans[j].type=="width") {
                    widthObj.widthTrans.push(propTrans[j]);
                    widthObj.indices.push(j);
                }
            }
            for(var j in widthObj.widthTrans) {
                propTrans.splice(propTrans.indexOf(widthObj.widthTrans[j]), 1);
            }
            widthObjs.push(widthObj);
        }
    }

    this.editColor = function(visuals, newColor) {
        //TODO FILL
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    ///////////////////////////////////////////////////////////////////////////////

    visualsModel = visuals_model;
    retimerModel = retimer_model;

    // Setup the canvas and overlay dimensions
    // Canvas size must be set using attributes, not CSS
    self.canvas = $('#'+canvasID);
    self.canvas.attr('width', visualsModel.getCanvasSize().width)
                .attr('height', visualsModel.getCanvasSize().height);
    self.canvasOverlay = $('#'+canvasOverlayID);
    self.canvasOverlay.css('width', visualsModel.getCanvasSize().width)
                    .css('height', visualsModel.getCanvasSize().height);

    // Get the context from the canvas
    self.context = self.canvas[0].getContext('2d');

    // Initialize other controllers
    toolsController = new ToolsController(self, visualsModel);
    renderer = new Renderer(self);

    // Register callbacks for the time controller
    lectureController.getTimeController().addUpdateTimeCallback(self.drawVisuals);

};

