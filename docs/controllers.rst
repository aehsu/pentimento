.. highlight:: rst

Controllers
============
 The controllers are the logic behind the application itself.


.. _time-controller:

Time Controller
---------------
 The controller in charge of managing time for the session

 .. js:class:: pentimento.timeController

 	the constructor function for the timeController

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
----------------------

 .. js:class:: pentimento.recordingController

 	Constructor function for the recordingController

 	.. js:function:: addSlide

 	adds a slide into the lecture; this function should be called by the UI whenever a slide is added

 	.. js:function:: addVisual(visual)

 	adds a visual into the current slide which is active

 	.. js:function:: appendVertex(visual, vertex)

 	appends a vertex into the list of vertices for the visual

 	.. js:function:: addProperty(visual, visualPropertyTransform)

 	adds in a property transform into the list of property transforms for the visual

 	.. js:function:: setTDeletion(visual, time)

 	sets the ``tDeletion`` time for the visual

 	.. js:function:: beginRecording

 	this function is what begins all recordings; the UI should call this function whenever it's about to begin a recording

 	.. js:function:: stopRecording

 	this function is what ends a recording; it will ask the ``timeController`` to end its recording process as well. The UI should call this function whenver it's trying to end a recording

.. _lecture-controller:

Lecture Controller
------------------

 .. js:class:: pentimento.lectureController

 	the constructor function for the lectureController

 	.. js:function:: setStateSlide

 	sets the ``state.currentSlide`` variable when asked to update it appropraitely based on ``state.videoCursor``

 	.. js:function:: getLectureDuration

 	:returns: the duration of the entire lecture

 	.. js:function:: removeSlide(newSlide)

 	removes the slide from the lecture's list of slides

 	.. js:function:: addSlide(prevSlide, newSlide)

 	inserts the ``newSlide`` right after the ``prevSlide``

 	.. js:function:: shiftSlideDuration(slide, amount)

 	changes the duration of the slide by the specified amount

 	.. js:function:: deleteSlide(slide)

 	removes the slide from the lecture's list of slides. different from removeSlide since this function is an edit mode function and will add actions onto the undo stack

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