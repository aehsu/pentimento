'use strict';

var TickerController = function() {
    var self = this;
    var tickerID = "ticker";

    this.updateTimeCallback = function(currentTime) {
        updateTicker(currentTime);
    };

    // TODO: the UI should be disabled at the appropriate times
    // this.beginTiming = function(currentTime) {
    //     updateTicker(currentTime);

    //     // Disable the ticker during timing
    //     // $('#'+sliderID).slider("option", {
    //     //     disabled: true
    //     // });
    // };

    // this.endTiming = function(currentTime) {
    //     updateTicker(currentTime);

    //     // Reenable the ticker after timing is over
    //     // $('#'+sliderID).slider("option", {
    //     //     disabled: false,
    //     // });
    // };

    // Updates the ticker display indicating the current time as a string
    var updateTicker = function(time) {
        var min = Math.floor(time/60000);
        time -= min*60000;
        var sec = Math.floor(time/1000);
        //time -= sec*1000;
        var ms = time % 1000; //same as subtracting.
        if(min==0) {
            min = '00';
        } else if(min<10){
            min = '0'+min;
        }
        if(sec==0){
            sec = '00';
        } else if(sec<10) {
            sec = '0'+sec;
        }
        if(ms==0) {
            ms = '000';
        } else if(ms<10) {
            ms = '00'+ms;
        } else if(ms<100) {
            ms = '0'+ms;
        }

        $('#'+tickerID).val(min + ':' + sec + '.' + ms);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////////// 

    // Register callbacks with the time controller
    lectureController.getTimeController().addUpdateTimeCallback(self.updateTimeCallback);
};
