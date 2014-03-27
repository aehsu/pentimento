.. highlight:: rst

Design
=======
 Though version 1.0 of the framework is designed for hand-written lecture notes specifically, the mentality of Pentimento was to design a base for any type of lecture. Text-based lectures are an area to which we hope to quickly migrate, leveraging the existing structure of Pentimento. The first version of Pentimento was developed using Cocoa, and was therefore specific to OS X. The current version of Pentimento uses JavaScript and is based in the browser for cross-compatibility across platforms.


Ideology
----------
 The key element of Pentimento that allows for more flexibility is the separation of visual elements and audio elements. While traditional recorders tightly synchronize these two channels, the ability to independently record them each and replay them in a synchronous fashion, gives much more power for someone seeking to edit mistakes in the lecture. Mistakes in one channel don't affect another, and therefore should be considered separately.

Architecture
-------------
 The system adheres closely to the `MVC <http://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller>`_ style of creating a system, and we have made numerous design decisions based on adherence to this principle. The MVC structure allows for clean separation of code and logic to only the areas which need access. However, JavasScript's inherent lack of classes (in the traditional sense) and `private` member declarations motivated a number of other decisions within the system.

High-level Overview
-------------------
 The basic observation which we work upon is that a majority of lectures which we are targeting can be fundamentally broken down into discrete chunks similar to slides or blackboards.

 Hence, a ``slide`` is the largest granularity of aggregation within the lecture. Necessary also to accompany ``slides`` is are ``slide_changes``.

 Each ``slide`` maintains an array of ``visuals``, and each ``visual`` has a number of fields it maintains, including ``properties`` such as color and size. Most important to each ``visual``, though, is that it maintains a an array of ``verticies``, which describe the resolution of the browser to track drawing events.

 
 **JONATHAN AUDIO**