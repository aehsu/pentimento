.. highlight:: rst


Pentimento
==============

Pentimento is encapsualted within its own namespace of ``pentimento``, and everything should be accessed through this namespace when referencing the models or the controllers. Helper functions are not encapsulated within the namespace, but are accessible through the global namespace. Likewise, enum's are not within the scope of ``pentimento``, but are accessible through the global namespace.

.. _pentimento-namespace:

Pentimento namespace
-----------------------
A variety of objects live under the ``pentimento`` namespace, all of which are primarily references to enforce strict access through the namespace.
  * ``pentimento`` -- the base of the namespace, and encapsulates the models and controllers
  * ``pentimento.state`` -- a reference to the :ref:`state-model` and all its fields
  * ``pentimento.lecture`` -- a reference to the :ref:`lecture-model`
  * ``pentimento.lectureController`` -- a reference to the :ref:`lecture-controller`
  * ``pentimento.lectureController.retimingController`` -- a reference to the :ref:`retiming-controller`
  * ``pentimento.lectureController.visualsController`` -- a reference to the :ref:`visuals-controller`
  * ``pentimento.recordingController`` -- a reference to the :ref:`recording-controller`
  * ``pentimento.timeController`` -- a reference to the :ref:`time-controller`

Global namespace
-----------------------

  * ``ActionGroups`` -- enum for the different groups which actions may belong to
  * ``ActionTitles`` -- enum for the different titles which actions may have
  * ``RecordingTypes``-- enum for the different types of recording which are available
  * ``um`` -- global reference to the undo manager for ``pentimento``
  * ``mouseDownHandler`` -- listener for ``mousedown`` events on the page. Primarily for monitoring the state of the mouse
  * ``mouseUpHandler`` -- listener for ``mouseup`` events on the page. Primarily for monitoring the state of the mouse
  * ``keyDownHandler`` -- listener for ``keydown`` events on the page. Can be used to fire off keyboard-shortcut events
  * ``keyUpHandler`` -- listener for ``keyup`` events on the page. Can be used to fire off keyboard-shortcut events
  * ``undoListener`` -- listener for ``click`` events on the page. Refreshes the state of the undo buttons on the page
  * ``redoListener`` -- listener for ``click`` events on the page. Refreshes the state of the redo buttons on the page

  .. js:class:: Iterator
  returns an iterator over an iterable item

    .. js:function:: hasNext()
    returns a ``boolean`` indicating whether or not another item in the iterable is available

    .. js:function:: next()
    returns the next item within the iterable. Should call ``hasNext`` as a check before calling this function

    .. js:attribute:: index
    a number which indicates the current index within the iterable. Rarely used in practice, highly discouraged

  .. js:function:: globalTime()
  returns a read of the local clock, in ms. All times in pentimento are with respect to milliseconds as integers.