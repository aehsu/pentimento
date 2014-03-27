.. highlight:: rst

Controllers
============
 The controllers are the logic behind the application itself.

Recording Controller
--------------------
 Any lecture is composed of one or more recordings pieced together correctly. This controller holds all the information necessary to do a recording. Recordings themselves cannot be edited, only after the recording is incorporated into the lecture can it be edited.

 .. js:data:: pentimento.recording_controller

 	.. js:function:: slide()

 		Internal constructor function used to create an empty ``slide`` object.

 		.. js:attribute:: visuals[]

 			Array of the visuals within the slide.

 		.. js:attribute:: duration

 			Duration of the slide from beginning of recording to end of recording.

 	.. js:function:: slide_change(from_page, to_page, time)

 		Internal constructor function used to create a ``slide_change`` object.

 		:param Number from_page: page from which the current transition occurs
 		:param Number to_page: page to which the current transition occurs
 		:param Number time: the time at which this transition occurs

 	.. js:function:: add_slide()

 		Public function which allows for the addition of a slide to the current recording. Edits ``pentimento.state`` to refer to the new slide.

 	.. js:function:: end_slide()

 		Internal function which stops the recording of the current slide and updates its duration. Only used when adding a new slide with ``add_slide()`` or when ending the recording.

 	.. js:function:: add_visual(visual)

 		Public function, adds the ``visual`` to the current slide.

 		:param Object visual: visual to be appended to the visuals in the current slide.

 	.. js:function:: do_record()

 		Public function, is the insertion point to begin a recording. Initializes an internal ``pentimento.lecture`` variable to hold the data for the current recording.

 	.. js:function:: stop_record()

 		Public function, is the end point for a recording. This controller then gives up its internal ``pentimento.lecture`` variable and passes it over to the ``pentimento.lecture_controller`` to handle insertion correctly.


Lecture Controller
------------------
 This controller is responsible for the master lecture which is the aggregation of the recordings together. It holds a private ``lecture`` object which must be accessed only through the controller.

 .. js:function:: pentimento.lecture_controller

 	The lecture controller itself.

 	.. js:function:: rewind()

 	Public function, simply goes back to the most previous ``slide_change``. Sets the appropriate state variables as well.

 	.. js:function:: full_rewind()

 	Public function, directly goes to the beginning of the lecture. Sets the appropriate state variables as well.

 	.. js:function:: insert_recording(recording)

 	Public function, takes in a lecture object which comes from ``pentimento.recording_controller`` and inserts it correctly into the master lecture based on when the recording started.

 	:param Object recording: lecture which comes from the recording controller.

UIUX Controller
---------------
