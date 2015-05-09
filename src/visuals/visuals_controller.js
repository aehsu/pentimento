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
    // The time is optional and is the audio time.
    // If the time is not provided, the visuals will be drawn at the current time of the time controller.
    this.drawVisuals = function(audio_time) {
        // Convert the audio time to visuals time,
        // or use the current time if undefined.
        var visuals_time;
        if (typeof audio_time !== 'undefined') {
            visuals_time = retimerModel.getVisualTime(audio_time);
        } else {
            visuals_time = self.currentVisualTime();
        };

        // Render the canvas
        var context = self.canvas[0].getContext('2d')
        renderer.drawCanvas(self.canvas, context, 0, visuals_time);
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
    // Modifying Slides
    ///////////////////////////////////////////////////////////////////////////////

    // Shortcut for the time controller time converted to visual time through the retimer
    this.currentVisualTime = function() {
        return retimerModel.getVisualTime(lectureController.getTimeController().getTime());
    };

    // Get the slide at the current time
    this.currentSlide = function() {
        return visualsModel.getSlideAtTime(self.currentVisualTime());
    };

    this.addSlide = function() {

        // Get the difference in time for when the slide began recording to the current time
        var time = self.currentVisualTime();
        var diff = time - slideBeginTime;

        // Get the previous slide and create a new slide
        var previousSlide = visualsModel.getSlideAtTime(slideBeginTime);

        var newSlide = new Slide();
        if (!previousSlide) { 
            console.error('previous slide missing');
        };

        // Update the duration of the current slide to reflect the difference
        previousSlide.setDuration(previousSlide.getDuration() + diff);
        
        // Insert the slide into the model
        var result = visualsModel.insertSlide(previousSlide, newSlide);
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
    // Modifying Visuals
    //
    // This section is primarily concerned with the modifying of the properties of
    // a visual. Modifying visuals during recording of visuals usually manifests as a transform, 
    // while modifying while in editing mode (i.e. not recording) usually directly changes the property.
    ///////////////////////////////////////////////////////////////////////////////

    // Add a visual that has finished being drawn
    this.addVisual = function(visual) {
        visualsModel.addVisuals([visual]);
    };

    // Delete the visuals in the selection during a recording.
    // This sets the tDeletion property for all visuals in the selection
    this.recordingDeleteSelection = function() {
        console.log('recording delete')
        var currentTime = self.currentVisualTime();

        // Use the model to set the deletion time
        visualsModel.visualsSetTDeletion(self.selection, currentTime);

        // Clear the selection and redraw to show the update
        self.selection = [];
        self.drawVisuals();
    };

    // Deletes all visuals in the selection while in editing mode.
    // This removes the visuals entirely from all points in time.
    this.editingDeleteSelection = function() {
        console.log('editing delete')

        // Use the model to delete the visuals
        visualsModel.deleteVisuals(self.selection);

        // Clear the selection and redraw to show the update
        self.selection = [];
        self.drawVisuals();

        // Redraw the thumbnails as well
        // TODO: find out a good way to signal the retimer controller
    };

    // Transform the visuals in the selection during a recording.
    this.recordingTransformSelection = function(transform_matrix) {

        var current_time = self.currentVisualTime();

        // Push the transform to the selected visuals
        for (var i = 0; i < self.selection.length; i++) {
            var visual = self.selection[i];

            // Get the final transform matrix that should be pushed.
            // The provided transform is just the difference between the current transform matrix
            // and the actual position, so multiply the two matrices.
            console.log(visual.spatialTransformAtTime(current_time));
            var current_transform_matrix = visual.spatialTransformAtTime(current_time).getMatrix();
            var total_transform_matrix = math.multiply(transform_matrix, current_transform_matrix);

            // Create the spatial transform that will be pushed to the visuals
            var new_transform = new VisualSpatialTransform(total_transform_matrix.valueOf(), current_time);

            visual.pushSpatialTransform(new_transform);
        };

        // Redraw at the current time
        self.drawVisuals(current_time);
    };

    // Transform the visuals in the selection while in editing mode.
    this.editingTransformSelection = function(transform_matrix) {

        // Apply the transform to the selected visuals
        for (var i = 0; i < self.selection.length; i++) {
            var visual = self.selection[i];
            visual.applySpatialTransform(transform_matrix);
        };

        // Redraw at the current time
        self.drawVisuals();
    };

    // Changes the width of the selection of visuals during recording
    // This pushes a property transform onto the selected visuals
    this.recordingWidthSelection = function(newWidth) {

    };

    // Changes the width of the selection of visuals during editing
    this.editingWidthSelection = function(newWidth) {
        console.log('newWidth: ' + newWidth)
        for(var i in self.selection) {
            var visual = self.selection[i];
            visual.getProperties().setWidth(newWidth);
        };

        // Clear the selection and redraw to show the update
        self.selection = [];
        self.drawVisuals();
    };

    this.editingColor = function(newColor) {
        console.log('newColor: ' + newColor)
        for(var i in self.selection) {
            var visual = self.selection[i];
            visual.getProperties().setColor(newColor);
        };

        // Clear the selection and redraw to show the update
        self.selection = [];
        self.drawVisuals();
    };

    this.recordingColor = function(newColor){
        if(self.selection.length == 0){
            console.log("change pen color for future strokes");
        }
        else{
            var currentTime = self.currentVisualTime();
            for(var i in self.selection) {
                var visual = self.selection[i];
                var propertyTransforms = visual.getPropertyTransforms();
                var newColorTransform = new VisualPropertyTransform(visual.getProperties().getColor(), newColor, currentTime);
                propertyTransforms.push(newColorTransform);
                visual.setPropertyTransforms(propertyTransforms);

            };

            // Clear the selection and redraw to show the update
            self.selection = [];
            self.drawVisuals();
        }
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
    toolsController = new ToolsController(self);
    renderer = new Renderer(self);

    // Register callbacks for the time controller
    lectureController.getTimeController().addUpdateTimeCallback(self.drawVisuals);

};

