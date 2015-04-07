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

    this.getLectureDuration = function() {
        // TODO
        // get the max times of all of the models
        return 140000;
    };
};
