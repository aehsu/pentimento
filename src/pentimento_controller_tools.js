function live_tool_handler(event) {
    var tool = $(event.target).attr('data-toolname');
    console.log(this);
    console.log(event);
    pentimento.state.tool = tool;
    //keep recording and switch tools
    switch(tool) {
    	case 'emphasis':
    		break;
    	case 'pen':
		
    		break;
    	case 'dots':
    		break;
    	case 'shape':
    		break;
    	case 'color':
    		break;
    	case 'width':
    		break;
    	case 'delete':
    		break;
    	case 'pan':
    		break;
    	case 'clear':
		pentimento.state.context.clearRect(0, 0, pentimento.state.canvas.width(), pentimento.state.canvas.height());
    		break;
    	default:
		pentimento.state.tool = null;
    		console.log('Unrecognized tool clicked, live tools');
    		console.log(this);
    }
}

function nonlive_tool_handler(event) {
    switch(tool) {
    	case 'play':
    		break;
    	case 'play-stop':
    		break;
    	case 'hyperlink':
    		break;
    	case 'insert-pic-vid-page':
    		break;
    	case 'selection':
    		break;
    	case 'record':
    		break;
    	case 'record-stop':
    		break;
    	case 'color':
    		break;
    	case 'width':
    		break;
    	case 'delete':
    		break;
    	case 'retime':
    		break;
    	case 'redraw':
    		break;
    	case 'insert':
    		break;
    	case 'pan':
    		break;
    	default:
    		console.log('Unrecognized tool clicked, non live tools');
    		console.log(this);
    }
}

$(document).ready(function() {
    $('.live-tool').click(/*function(event) {
         console.log('getting ready in tools controller');
         live_tool_handler(event);
    }*/live_tool_handler);            
    $('.nonlive-tool').click(function(event) {
        var tool = $(this).attr('data-tool-name');
        //stop recording and switch tools
    });
    
    $('.recording-tool').click(function(event) {
        var elt = $(event.target);
        if (elt.attr('data-label')==='begin') {
            pentimento.state.is_recording=true;
        } else {
            pentimento.state.is_recording = false;
        }
        $('.recording-tool').toggleClass('hidden');
    });    
});
