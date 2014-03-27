.. highlight:: rst

Models
=======
 Models in our system represent the raw data itself, but do not have any notion of how to manipulate the data. Models are purely a container for data, almost like channels. Any additional classes that might be defined for data should be made as a model.

Lecture Model
--------------
 The lecture model represents a constructor function, or something similar to classes in the traditional sense. The lecture model itself contains only fields, and any future extension to the data a lecture should store can be made in the lecture model.

 .. js:class:: pentimento.lecture()

 	Constructor function for lecture objects

 	:returns: new lecture object

 	.. js:attribute:: slides[]

 		Array of slides within the lecture. Initially empty, slides are 0-indexed.

 	.. js:attribute:: slide_changes[]

 		Array of slide_changes within the lecture. Begins with a ``{from_slide:-1, to_slide:0, time:0}`` slide_change. 

 	.. js:attribute:: audio_tracks[]

 		**SOME DESCRIPTION, JONATHAN**


State Model
--------------
 The state model represents a different fundamental element from the lecture model. The state represents more a shared channel for methods to access in their need for information about the current session of recording. As such, the state model is not a constructor but an already-initialized object of information with default values.

 Sessions begin and end on leaving of a page or refresh of the page.

 .. js:data:: pentimento.state

    Maintains information about the recording session

    .. js:attribute:: is_recording

 	``boolean`` about whether the system is currently recording

    .. js:attribute:: current_slide

 	``reference`` to which slide the user is currently viewing or editing. Alias to an element within ``pentimento.lecture.slides``

    .. js:attribute:: color

 	Hex-value referring to the most-recently selected color for visuals

    .. js:attribute:: width

 	``string`` referring to the most-recently selected width for visuals

    .. js:attribute:: current_tool

 	``string`` referring to which tool is currently enabled by the user

    .. js:attribute:: lmb_down

	``boolean`` referring to whether the left mouse button is down

    .. js:attribute:: last_point

	Object with an ``x`` and ``y`` attribute referring to the last point the ``current_tool`` needs to utilize its function

    .. js:attribute:: context

	The context of the drawing canvas

    .. js:attribute:: canvas

	The HTML ``canvas`` element

    .. js:attribute:: current_visual

	The current visual which the tool is modifying

    .. js:attribute:: pressure

	``boolean`` about whether or not the hardware supports pressure sensitivity

    .. js:attribute:: pressure_color

	Hex-value representing the color to interpolate into if pressure sensitivity is applicable

    .. js:attribute:: pressure_width

	Width to interpolate to if pressure sensitivity is applicable

    .. js:attribute:: tool

	**LOL LIKE I KNOW?! I HAVE NO IDEA, CURRENT_TOOL?**

    .. js:attribute:: current_time = 0

	The time within the lecture that a user is currently at. Initialized to a default value of 0.

    .. js:attribute:: last_time_update = null

	Represents the clock time when the system last updated as it was recording. As the timers in JavaScript are unreliable, updates to the recording interval are based on this field.

    .. js:attribute:: interval_timing = 50

	I don't know. **Represents something I have forgotten.**

    .. js:attribute:: selection = []

	If the tool currently enabled is the selection tool, maintains an array of references to the visuals which are selected.