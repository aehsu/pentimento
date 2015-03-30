/*************************************************
					MODEL
*************************************************/
pentimento.state = new function() {
    this.recordingType = null;
    
	this.color = '#777';
	this.width = 2;
    this.pressureColor; //false
    this.pressureWidth; //false
    
    this.canvas;
    this.context;

    this.pressure;
	this.lmb = false;
    this.mmb = false;
    this.rmb = false;
    this.ctrlKey = false;
    this.shiftKey = false;
    this.altKey = false;
    this.keyboardShortcuts = false;
    
    this.tool = null; //whichever tool is active for a recording
	this.lastPoint = null;
    this.currentVisual = null;
    this.selection = [];
    
    this.currentSlide = null;
    this.videoCursor = 0.0;
};

// Returns true if this Internet Explorer 10 or greater, running on a device
// with msPointer events enabled (like the ms surface pro)
function ie10TabletPointer() {
    var ie10 = /MSIE (\d+)/.exec(navigator.userAgent);

    if (ie10 != null) {
        var version = parseInt(ie10[1]);
        if (version >= 10) { ie10 = true; }
        else { ie10 = false; }
    } else { ie10 = false; }

    var pointer = navigator.msPointerEnabled ? true : false;
    if (ie10 && pointer) { return true; }
    else { return false; }
}

$(document).ready(function() {
    pentimento.state.canvas = $('#'+canvasId);
    pentimento.state.context = pentimento.state.canvas[0].getContext('2d');

    if (ie10TabletPointer()) {
        console.log('Pointer Enabled Device');
        pentimento.state.pressure = true;
        pentimento.state.pressureColor = true;
        pentimento.state.pressureWidth = true;
    } else {
        console.log('Pointer Disabled Device');
        pentimento.state.pressure = false;
        pentimento.state.pressureColor = false;
        pentimento.state.pressureWidth = false;
    }
})