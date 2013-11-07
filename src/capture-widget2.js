var pentimento  = {
	/*************************************************
						MODELS
	*************************************************/
	lecture: function() {
		this.slides = [];
		this.slide_changes = [];
		this.is_recording = false;
		this.current_slide = null;
		this.current_time = null; //necessary?
		this.end_time = null; //necessary?

		this.add_slide = function(slide) {
			this.slides.push(slide);
		}

	},

	slide: function() {
		this.begin_time = null;
		this.end_time = null;
		this.VISUALS = [];
		this.current_time = null;

		this.add_visual = function(visual) {
			this.VISUALS.push(visual);
		}
		this.get_visuals = function() {
			return this.VISUALS;
		}
		this.get_visual_by_index = function(index) {
			return this.VISUALS[index];
		}
		this.insert_visual_at_index = function(visual, index) {

		}
		this.insert_visual_at_time = function(visual, t_audio) { //t_audio, t_visual?

		}
	},

	slide_change: function(from_page, to_page, t_audio) { //should this live with t_audio????
		this.from_page = from_page;
		this.to_page = to_page;
		this.t_audio = t_audio;
	},

	/*************************************************
					  CONTROLLERS
	*************************************************/
	recording_controller: function (init) { //sync slider + ticker. holds triggers for things. will hold temp lecture for insertions
		var canvas = '#'+init.canvas_id;
		var slider = '#'+init.slider_id;

		this.set_slider_ticks = function(t_audio) {
			$(slider).slider('option', 'max', t_audio);
		}
	},

	lecture_controller: function(lecture) {
		var lecture = lecture;

		this.create_slide_with_controller = function() {
			var slide = new slide();
			lecture.add_slide(slide);
			var slide_controller = new slide_controller(slide);
			return slide_controller;
		}
	},

	slide_controller: function(slide) {
		 var slide = slide;
	},

	/*************************************************
						VIEW
	*************************************************/

	/* *****************************************************************************
	 *  capture_widget captures and displays input
	 *  uses either paint_widget or smart_paint_widget depending on the capabilities
	 *  of the device
	 * ****************************************************************************/

	capture_widget: function(init){
	    var canvas_dom_id = init.canvas_id;
	    var canvas_id = '#' + canvas_dom_id;
	    var canvas; // drawing widget

	    var enabled = false;
	    var lmb_down = false;  // is the left mouse button down
	    //var inline = false   // are we currently drawing a stroke
	    var last_point;      // last coordinate of move or click event
	    var VisualTypes = {
	        dots: 'dots',
	        stroke: 'stroke'
	    };
	    var active_visual_type = VisualTypes['stroke'];


	    var PEN; // pointer enabled device, unused for now
	    var current_visual;

	    function empty_visual(){
	        return {
	            type: '',
	            doesItGetDeleted: false,
	            tDeletion: 0,
	            tEndEdit: 0,
	            tMin: 0,
	            properties: JSON.parse(JSON.stringify(canvas.properties)), //copy the current properties of the canvas object
	            vertices:[]
	        }
	    }

	    function on_mousedown(event) {
	        if (! enabled){return;}

	        event.preventDefault();
	        lmb_down = true;
	        //console.log('mousedown')

	        current_visual = empty_visual();
	        current_visual.type = active_visual_type;
	        last_point = canvas.relative_point(event);

	        current_visual.vertices.push(last_point);

	        if (active_visual_type == VisualTypes.dots) {
	            canvas.draw_point(last_point);
	        }

	    }
	    function on_mousemove(event) {
	        if (! enabled){return;}
	        event.preventDefault()

	        if (lmb_down) {
	            var cur_point = canvas.relative_point(event)

	            if (active_visual_type == VisualTypes.dots) {
	                canvas.draw_point(cur_point);
	            }
	            else if (active_visual_type == VisualTypes.stroke) {
	                canvas.draw_line({
	                        from: cur_point,
	                        to: last_point,
	                        properties: current_visual.properties
	                });
	            }
	            else {
	                console.log("unknown drawing mode");
	            }

	            last_point = cur_point;
	            current_visual.vertices.push(last_point);
	        }

	    }
	    function on_mouseup(event) {
	        if (! enabled){return;}
	        event.preventDefault();

	        if (lmb_down) {
	            lmb_down = false;
	            return current_visual;
	        }

	        //inline = false

	        //console.log('mouseup')
	    }

	    function draw_visuals(visuals){
	        for (var i=0; i<visuals.length; i++){
	            var visual = visuals[i];

	            if (visual.type == VisualTypes.dots){
	                for(var j=0; j<visual.vertices.length; j++){
	                    var vertex = visual.vertices[j]
	                    canvas.draw_point(vertex)
	                }
	            } else if(visual.type == VisualTypes.stroke){
	                for(var j=1; j<visual.vertices.length; j++){
	                    var from = visual.vertices[j-1]
	                    var to = visual.vertices[j]
	                    var line = {
	                        from: from,
	                        to: to,
	                        properties: visual.properties
	                    };
	                    canvas.draw_line(line);
	                }
	            } else {
	                console.log('unknown visual type');
	            }
	        }
	    }

	    function draw_visual(visual) {
	        if (visual.type == VisualTypes.dots) {
	            for(var j=0; j<visual.vertices.length; j++) {
	                var vertex = visual.vertices[j];
	                canvas.draw_point(vertex);
	            }
	        } else if(visual.type == VisualTypes.stroke) {
	            for(var j=1; j<visual.vertices.length; j++){
	                var from = visual.vertices[j-1]
	                var to = visual.vertices[j]
	                var line = {
	                    from: from,
	                    to: to,
	                    properties: visual.properties
	                };
	                canvas.draw_line(line);
	            }
	        }
	    }

	    function export_recording_to_pentimento_format(){

	        console.log('start export to pentimento')
	        var canvas_height = $(canvas_id).height()
	        var canvas_width = $(canvas_id).width()

	        var result = {
	            pageFlips: undefined,
	            visuals: undefined,
	            cameraTransforms: undefined,
	            height: canvas_height,
	            width: canvas_width,
	            durationInSeconds: (recording_stop_time - recording_start_time)/1000
	        }


	        //pageFlips
	        result.pageFlips = []
	        result.pageFlips[0] = {
	            page: 1,
	            time: -100000.0
	        }

	        //cameraTransforms
	        result.cameraTransforms=[]
	        result.cameraTransforms[0] = {
	            tx: 0.0,
	            ty: 0.0,
	            m21: 0.0,
	            m22: 1.0,
	            m11: 1.0,
	            m12: 0.0,
	            time: -100000.0
	        }

	        //visuals
	        result.visuals = []


	        for (var i=0; i<VISUALS.length; i++){
	            if (VISUALS[i].type == VisualTypes.stroke){

	                var v = {}
	                v.type = 'stroke'
	                v.tDeletion = 0
	                v.tMin = (VISUALS[i].vertices[0].t - recording_start_time)/1000
	                var nverts = VISUALS[i].vertices.length
	                v.tEndEdit = (VISUALS[i].vertices[nverts-1].t - recording_start_time)/1000
	                v.doesItGetDeleted = false
	                v.properties = []
	                v.properties[0] = {
	                    red: 0,
	                    green: 0,
	                    blue: 0,
	                    alpha: 1,
	                    redFill: 0,
	                    blueFill: 0,
	                    greenFill: 0,
	                    alphaFill: 1,
	                    thickness: 10,
	                    time: v.tEndEdit - v.tMin,
	                    type: 'basicProperty'
	                }

	                v.vertices = []
	                for (var j=0; j<VISUALS[i].vertices.length; j++){

	                    var vertex = {
	                        x: VISUALS[i].vertices[j].x,
	                        y: canvas_height - VISUALS[i].vertices[j].y,
	                        t: (VISUALS[i].vertices[j].t - recording_start_time)/1000,
	                        pressure: (VISUALS[i].vertices[j].pressure == undefined)? 0.8 : VISUALS[i].vertices[j].pressure
	                    }

	                    v.vertices.push(vertex)
	                }

	                result.visuals.push(v)
	            }
	            else {
	                console.log('skipping unsupported pentimento visual type: ' + visual.type)
	            }
	        }

	        console.log('end export to pentimento')
	        return result
	    }

	    // Returns true if this Internet Explorer 10 or greater, running on a device
	    // with msPointer events enabled (like the ms surface pro)
	    function ie10_tablet_pointer() {
	        var ie10 = /MSIE (\d+)/.exec(navigator.userAgent);

	        if (ie10 != null) {
	            var version = parseInt(ie10[1]);
	            if (version >= 10) {
	                ie10 = true;
	            } else {
	                ie10 = false;
	            }
	        } else {
	            ie10 = false;
	        }

	        var pointer = navigator.msPointerEnabled ? true : false;

	        if (ie10 && pointer) {
	            return true;
	        } else {
	            return false;
	        }
	    }


	    // Initialize the widget (this function is called right after it is defined)
	    // sets the canvas variable to be a (smart_)paint_widget
	    function widget_init() {
	        if (ie10_tablet_pointer()) {
	            console.log('Pointer Enabled Device');
	            canvas = new smart_paint_widget(canvas_id);

	            var c = document.getElementById(canvas_dom_id);
	            c.addEventListener("MSPointerUp", on_mouseup, false);
	            c.addEventListener("MSPointerMove", on_mousemove, false);
	            c.addEventListener("MSPointerDown", on_mousedown, false);
	        } else {
	            console.log('Pointer Disabled Device');
	            canvas = new paint_widget(canvas_id);
	            $(canvas_id).mousedown(on_mousedown);
	            $(canvas_id).mousemove(on_mousemove);
	            $(window).mouseup(on_mouseup);
	        }


	        //$(window).resize(resize_canvas)

	        /*
	         //ignore touch events for now
	         canvas = $("#canv")[0]
	         canvas.addEventListener('touchstart', on_mousedown, false);
	         canvas.addEventListener('touchmove', on_mousemove, false);
	         window.addEventListener('touchend', on_mouseup, false);
	         */

	       canvas.resize_canvas();
	    }

	    /* *************************************************************************
	     *  Public Methods
	     * *************************************************************************/

	    // Erases the entire canvas
	    this.clear = function(){
	        canvas.clear()
	    }

	    // Change the interpolation mode
	    this.set_active_visual_type = function(type_str){
	        active_visual_type = VisualTypes[type_str]
	    }

	    this.get_recording = function(){
	        var pentimento_record = export_recording_to_pentimento_format();
	        return pentimento_record;
	    }

	    this.change_property = function(change) {
	        if(!enabled) { return; }
	        change.time = global_time();
	        canvas.properties[change['property']] = change['value'];
	        console.log(change);
	    }
	    this.initialize = function() { widget_init(); }
	    this.enable = function() { enabled = true; }
	    this.disable = function() { enabled = false; }
	},

	// paint_widget encapsulates drawing primitives for HTML5 canvas
	paint_widget: function(canvas_id){
	    var canvas_id = canvas_id;
	    var default_line_color = '#777';
	    var default_line_width = 2;
	    var default_point_color = '#222';

	    //this properties object needs to be propagated to the smart widget
	    this.properties = {
	        line_color: undefined,
	        line_width: undefined,
	        point_color: undefined
	    };

	    function get_ctx() {
	        return $(canvas_id).get(0).getContext('2d'); // todo replace with static ctx? yes?
	    }

	    this.draw_line = function(line) {
	         /*
	            line = {
	                from: point,
	                to: point,
	                color: string  // optional
	                width: int    // optional
	            }
	          */
	        var ctx = get_ctx();
	        ctx.beginPath();
	        ctx.moveTo(line.from.x, line.from.y);
	        ctx.lineTo(line.to.x, line.to.y);

	        ctx.strokeStyle = (line.properties == undefined || line.properties.line_color == undefined) ? default_line_color : line.properties.line_color;
	        ctx.lineWidth = (line.properties == undefined || line.properties.line_width == undefined) ? default_line_width : line.properties.line_width;
	        ctx.lineCap = 'round';

	        ctx.stroke();
	    }

	    this.draw_point = function(coord) {
	        var ctx = get_ctx()
	        ctx.beginPath();
	        ctx.fillStyle = default_point_color;
	        ctx.fillRect(coord.x - 1, coord.y - 1, 3, 3);
	    }

	    this.clear = function(){
	        var ctx = get_ctx();
	        ctx.clearRect(0, 0, $(canvas_id).width(), $(canvas_id).height())
	    }

	    this.relative_point = function(event){
	        var pt = {
	            x: event.pageX - $(canvas_id).offset().left, // todo fix if canvas not in corner
	            y: event.pageY - $(canvas_id).offset().top,
	            t: global_time()
	        };

	        return pt;
	    }

	    this.resize_canvas = function() {
	        var iw = $(window).width();
	        var ih = $(window).height();

	        $(canvas_id)[0].width = 0.9 * iw
	        $(canvas_id)[0].height = 0.8 * ih
	    }
	},

	// smart_paint_widget wraps paint_widget to modify the drawing primitives
	// to use advanced input sensors such as pressure
	smart_paint_widget: function(canvas_id){

	    var canvas = new paint_widget(canvas_id)
	    var pressure_color = false  // Change color of strokes dep on pressure?
	    var pressure_width = true  // Change width of strokes dep on pressure?
	    var max_extra_line_width = 4

	    this.draw_line = function(line) {

	        /*
	            line = {
	               from: point,
	               to: point,
	                ...
	            }
	         */

	        var avg_pressure = 0.5 * (line.from.pressure + line.to.pressure)

	        if (pressure_color) {
	            var alpha = (1 - 0.5) + 0.5 * avg_pressure
	            line.color = 'rgba(32,32,32,' + alpha + ')' // todo use defaults
	        }
	        else {
	            line.color = 'rgba(64,64,64,1)'  // todo use defaults
	        }

	        if (pressure_width) {
	            line.width = 1 + Math.round(max_extra_line_width * avg_pressure) // todo use defaults
	        }
	        else {
	            line.width = 2 // todo use defaults
	        }

	        canvas.draw_line(line)
	    }

	    this.relative_point = function(event){
	        var pt = canvas.relative_point(event);
	        pt.pressure  = event.pressure;
	        return pt;
	    }

	    this.draw_point = canvas.draw_point
	    this.clear = canvas.clear
	    this.resize_canvas = canvas.resize_canvas
	}
}