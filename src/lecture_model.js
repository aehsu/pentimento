// Lecture model object
// Contains the models for the visuals, audio, and retimer
'use strict';

var LectureModel = function() {
    var visualsModel = null;
    var audioModel = null;
    var retimerModel = null;

    //
    this.init = function() {
        visualsModel = new VisualsModel();
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
        return Math.max(audioModel.getDuration(), visualsModel.getDuration());
    };
};