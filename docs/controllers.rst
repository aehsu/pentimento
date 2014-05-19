.. highlight:: rst

Controllers
============
 The controllers are the logic behind the application itself.


.. _time-controller:

Time Controller
---------------
 The controller in charge of managing time for the session

 .. js:class:: pentimento.timeController

 	it is what it is

 	.. js:function:: stopRecording(endTime)

 		ends the recording with the given time

 	.. js:function:: beginRecording(time)

 		begins a recording with the given time

 	.. js:function:: updateVideoTime(time)

 		updates the ``videoCursor`` of the state to reflect the given time

.. _input-controller:

Input Controller
-----------------
 Not especially a controller, but maintains handlers which listen in on events and update the state accordingly.

	.. js:function:: mouseDownHandler(event)

 	updates the state about the mouse buttons accordingly

 	.. js:function:: mouseUpHandler(event)

 	updates the state about the mouse buttons accordingly

 	.. js:function:: keyDownHandler(event)

 	updates the state about the keyboard buttons accordingly

 	.. js:function:: keyUpHandler(event)

 	updates the state about the keyboard buttons accordingly

 	.. js:function:: undoListener(event)

 	updates the UI to reflect whether or not undo events are possible

 	.. js:function:: redoListener(event)

 	updates the UI to reflect whether or not redo events are possible

.. _recording-controller:

Recording Controller
--------------------
 

.. _lecture-controller:

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

.. _visuals-controller:

Visuals Controller
--------------------

 .. js:class:: VisualsController

 	The controller in charge of manipulating the visuals of a lecture, regardless of which slide it passed in

 	.. js:function:: makeVisualDirty(visuals)

 	makes the visuals given "dirty", meaning to disable them for the duration of the recording

 	.. js:function:: cleanVisuals(dirtyWrappers, amount)

 	"cleans" the visuals which are wrapped inside of the "dirty" objects, and shifts them by the appropriate amount

 	.. js:function:: addVisual(slide, visual)

 	adds the visual to the slide appropriately

	.. js:function:: appendVertex(visual, vertex)

	appends the vertex to the visual

	.. js:function:: addProperty(visual, property)

	appends the property transformation into the visual

	.. js:function:: setTDeletion(visual, time)

	sets the ``tDeletion`` for the visual to the given time

	.. js:function:: editWidth(visual, newWidth)

	changes the original width of the given visual

	.. js:function:: shiftVisuals(visuals, amount)

	shifts the given visuals by the specified amount

	.. js:function:: deleteVisuals(slide, visuals)

	deletes the given visuals from the slide

.. _retiming-controller:

Retiming Controller
--------------------
 The controller in charge of handling everything associated with constraints

 .. js:class:: RetimingController

 	constructor for the retiming controller

 	:returns: a new retiming controller object

 	.. js:function:: makeConstraintDirty(constraint)

 	disables the given constraint

 	.. js:function:: checkConstraint(constraint)

 	ensures that the given constraint does not conflict with any others

 	:returns: a boolean indicating whether the constraint is okay or not

 	.. js:function:: addConstraint(constraint)

 	places the constraint within the array of constraints for the lecture if it's compatible

 	:returns: whether the addition was successful or not

 	.. js:function:: deleteConstraint(constraint)

 	deletes the constraint from the array of constraints

 	.. js:function:: shiftConstraints(constraints, amount)

 	shifts the given constraints by the amount specified

 	.. js:function:: getVisualTime(audioTime)

 	:returns: a linear interpolation of the audioTime given the constraints and returns the visual time that would result from interpolating the audioTime

 	.. js:function:: getAudioTime(visualTime)

 	:returns: a linear interpolation of the visualTime given the constraints and returns the audio time that would result from interpolating the visualTime