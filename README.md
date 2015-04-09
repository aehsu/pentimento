Pentimento
==========
An HTML5 canvas sketchpad for flexibile editing of hand-written lecture notes.

How to run it
-------------
Because of the need to record audio and the origin-policies of browsers, you'll likely need to access it at an address. We recommend any simple HTTP server, and `Python` provides a very handy module to do this.

    python -m SimpleHTTPServer

Which will serve up the application at `localhost:8000`.

Code
----
The entry point of the application is in `lecture_controller.js`. This file initializes the application when
the document is ready. No other file should initialize objects on document ready. Objects usually should be 
created under the `LectureController` hierarchy. Any object that does not fit in this hierarchy should be
defined in the `pentimento` global object.