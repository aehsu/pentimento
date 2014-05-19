.. highlight:: rst

.. _pentimento-models:

Models
=======
 Models in our system are the raw data itself, but do not have any notion of how to manipulate the data. Models are purely a container for data, with ``get.*`` and ``.*`` methods for all fields when appropriate. Any additional classes that might be defined for data should be made as a model.

.. _lecture-model:

Lecture Model
--------------
 The lecture model is a constructor function. Any future extension to the data a lecture should store can be made in the lecture model. For a lecture, there is only one ``pentimento.lecture`` at any point in time. Modifications to the lecture are performed directly on the object.

 .. js:class:: Lecture

 	Constructor function for lecture objects

 	:returns: new lecture object

 	.. js:attribute:: slides[]

 		Array of slides within the lecture. Slides are 0-indexed

 	.. js:attribute:: audioTracks[]

 		**SOME DESCRIPTION, JONATHAN**

 	.. js:attribute:: constraints[]

 		A time-ordered array of constraints within the lecture

.. _constraint-model:

Constraint Model
------------------
 .. js:class:: Constraint

    Constructor function for constraint objectts

    :returns: new constraint object

    .. js:attribute:: tVis

        The visual time of the constraint

    .. js:attribute:: tAud

        The audio time of the constraint

    .. js:attribute:: type

        Whether the constraint was manually placed or automatically placed

    .. js:attribute:: disabled

        Whether or not the constraint is disabled, used during recording

.. _vertex-model:

Vertex Model
--------------
 .. js:class:: Vertex

    Constructor function for new vertex objects

    :returns: new vertex object

    .. js:attribute:: x

        x coordinate

    .. js:attribute:: y

        y coordinate

    .. js:attribute:: t

        time coordinate

    .. js:attribute:: p

        pressue coordinate

.. _visualproperty-model:

VisualProperty Model
---------------------
 .. js:class:: VisualProperty

    Constructor function for new ``VisualProperty`` objects

    :returns: new ``VisualProperty`` object

    .. js:attribute:: color

        the color for the visual

    .. js:attribute:: width

        the width for the visual

.. _visualpropertytransform-model:

VisualPropertyTransform Model
-------------------------------

  .. js:class:: VisualPropertyTransform

    Constructor function for new ``VisualPropertyTransform`` objects

    :returns: new ``VisualPropertyTransform`` object

    .. js:attribute:: property

        the property which is being transformed

    .. js:attribute:: value

        the new value for the property

    .. js:attribute:: time

        the time of the property transformation

.. _basicvisual-model:

BasicVisual Model
------------------

  .. js:class:: BasicVisual

    Abstract class for visuals

    :returns: basic visuals object

    .. js:attribute:: type

        the type of this visual

    .. js:attribute:: hyperlink

        the hyperlink for this visual

    .. js:attribute:: tMin

        the time when this visual came into existence within the lecture

    .. js:attribute:: properties

        a ``VisualProperty`` object about this visual's color and width

    .. js:attribute:: tDeletion

        the time when this visual was deleted within the lecture

    .. js:attribute:: propertyTransforms[]

        an array of transformations of this visual's properties

.. _strokevisual-model:

StrokeVisual Mode
-------------------

 .. js:class:: StrokeVisual

    constructor function for a stroke visual

    :returns: stroke visual object

    .. js:attribute:: vertices[]

        an array of ``Vertex`` objectts for this visual

.. _slide-model:

Slide Model
--------------
The state model is a constructor function.

  .. js:class:: Slide

    Constructor function for new slide objects

    :returns: new slide object

    .. js:attribute:: visuals[]

        Array of visuals within the lecture

    .. js:attribute:: transforms[]

        A time-ordered array of transforms which have been applied to the slide

    .. js:attribute:: duration

        In ms, the duration of a slide. The duration of a lecture is the sum of the slide durations

.. _state-model:

State Model
--------------
 The state model represents a different fundamental element from the lecture model. The state represents more a shared channel for methods to access in their need for information about the current session of recording. As such, the state model is not a constructor but an already-initialized object of information with default values.

 Sessions begin and end on leaving of a page or refresh of the page.

 .. js:data:: pentimento.state

    Maintains information about the recording session

    .. js:attribute:: isRecording

 	``boolean`` about whether the system is currently recording

    .. js:attribute:: recordingType

    an enum of ``RecordingTypes`` indicating what kind of recording is currently underway

    .. js:attribute:: currentSlide

 	``reference`` to which slide the user is currently viewing or editing. Alias to an element within ``pentimento.lecture.slides``

    .. js:attribute:: videoCursor

    an integer in milliseconds representing the current time within the lecture for the visuals channel

    .. js:attribute:: audioCursor

    an integer in milliseconds representing the current time within the lecture for the audio channel

    .. js:attribute:: canvas

    a jQuery object referring to the ``canvas`` element on the page

    .. js:attribute:: context

    the context object for the ``canvas`` on the page

    .. js:attribute:: color

 	string hex-value referring to the most-recently used color for visuals

    .. js:attribute:: width

 	integer referring to the most-recently used width for visuals

    .. js:attribute:: pressure

    boolean indicating whether to consider pressure on the canvas

    .. js:attribute:: keyboardShortcuts

    ``boolean`` referring to whether to fire keyboard shortcuts

    .. js:attribute:: lmb

    ``boolean`` referring to whether the left mouse button is down

    .. js:attribute:: mmb

    ``boolean`` referring to whether the middle mouse button is down

    .. js:attribute:: rmb

    ``boolean`` referring to whether the right mouse button is down

    .. js:attribute:: ctrlKey

    ``boolean`` referring to whether the ``ctrl`` key is down

    .. js:attribute:: shiftKey

    ``boolean`` referring to whether the ``shift`` key is down

    .. js:attribute:: altKey

    ``boolean`` referring to whether the ``alt`` key is down

    .. js:attribute:: tool

 	``string`` referring to which tool is currently enabled by the user

    .. js:attribute:: lastPoint

	``Vertex`` object referring to the last useful point for the current tool

    .. js:attribute:: currentVisual

	The current visual which the tool is modifying

    .. js:attribute:: selection

	An array of references to the visuals which are selected