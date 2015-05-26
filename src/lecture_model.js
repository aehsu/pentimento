// Lecture model object
// Contains the models for the visuals, audio, and retimer
'use strict';

var LectureModel = function() {
    var visualsModel = null;
    var audioModel = null;
    var retimerModel = null;

    var init = function() {

        visualsModel = new VisualsModel(800, 500);
        audioModel = new AudioModel();
        retimerModel = new RetimerModel();
    };

    this.getVisualsModel = function() { return visualsModel; }
    this.getAudioModel = function() { return audioModel; }
    this.getRetimerModel = function() { return retimerModel; }

    this.setVisualsModel = function(newVisualsModel) { visualsModel = newVisualsModel; }
    this.setAudioModel = function(newAudioModel) { audioModel = newAudioModel; }
    this.setRetimerModel = function(newRetimerModel) { retimerModel = newRetimerModel; }

    // Get the duration of the lecture in milliseconds, which is the max duration of the audio and visuals
    this.getLectureDuration = function() {
        return Math.max(audioModel.getDuration(), retimerModel.getAudioTime(visualsModel.getDuration()));
    };

    // Loading the model from JSON
    this.loadFromJSON = function(json_object) {
        visualsModel = VisualsModel.loadFromJSON(json_object['visuals_model']);
        audioModel = AudioModel.loadFromJSON(json_object['audio_model']);
        retimerModel = RetimerModel.loadFromJSON(json_object['retimer_model']);
    };

    // Saving the model to JSON
    this.saveToJSON = function() {
        var json_object = {
            visuals_model: visualsModel.saveToJSON(),
            audio_model: audioModel.saveToJSON(),
            retimer_model: retimerModel.saveToJSON()
        };

        console.log(JSON.stringify(json_object));

        return json_object;
    };

    // Initialize
    init();
};
