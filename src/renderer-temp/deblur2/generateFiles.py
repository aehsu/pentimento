import glob

lecture = glob.glob('*.lec')[0]

name = lecture.replace(".lec","")

htmlFile = open(name+'.html','w')
template = """
<html>
    <head>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js"></script>
        <script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
        <link href='http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css' rel='stylesheet' type='text/css'>
        <script src="http://web.mit.edu/lu16j/www/WebPentimento/generalfunctions.js"></script>
        <script src="http://web.mit.edu/lu16j/www/WebPentimento/listeners.js"></script>
        <script src="http://web.mit.edu/lu16j/www/WebPentimento/renderer.js"></script>
        <script src="
        """\
        +name+\
        """
.js"></script>
        <script src="http://web.mit.edu/lu16j/www/WebPentimento/preprocessor.js"></script>
        <script src="http://web.mit.edu/lu16j/www/WebPentimento/player.js"></script>
        <link href="http://web.mit.edu/lu16j/www/WebPentimento/player.css" type="text/css" rel="stylesheet">
    </head>
    <body>
        <div class='pentimento' data-name='
        """\
        +name+\
        """
'>
            <div class='lecture'>
                <div class='canvas_container'>
                    <canvas class='video'></canvas>
                </div>
                <div class='onScreenStatus'>
                    <img src='http://web.mit.edu/lu16j/www/WebPentimento/images/pause.png' id='pauseIcon' width='0px' height='0px'> </div>
                <br> <div class='captions'>test captions</div>
                <div class='controls'>
                    <div id='slider'>
                        <div class="tick ui-widget-content"></div>
                    </div>
                    <div class='buttons'>
                        <input class='start' type='button'/>
                        <button class="slowDown top"></button>
                        <button class="speedUp top"></button>
                        <button class="prevChapter bottom"></button>
                        <button class="nextChapter bottom"></button>
                        <button class="help" title="About"></button>
                    </div>
                    <div id='totalTime'></div>
                    <button class='volume'></button>
                    <div class='volumeSlider'></div>
                    <audio class='audio' preload='auto'>
                        <source id='lectureAudio' src='
                        """\
                        +name+\
"""
-resources/audio.mp3' tyoe='audio/mpeg'>
                        <source id='lectureAudioOgg' src='
                        """\
                        +name+\
"""
-resources/audio.ogg' tyoe='audio/mpeg'>
                    </audio>
                    <div class="speedDisplay"></div>
                </div>
                <div class='zoomRect'></div>
                <div id='description-dialog'>
                    <h3><img src='http://web.mit.edu/lu16j/www/WebPentimento/images/penti.png'> Pentimento Player</h3>
                    <ul><li>Click on a stroke to go to that point in the video</li>
                        <li>Drag, scroll, or use arrow keys to pan around</li>
                        <li>Shift-Scroll to zoom</li>
                        <li>Double-click to zoom</li>
                        <li>Shift-Arrow Key to pan faster</li>
                    </ul><button id='closeDialog'>OK</button>
                </div>
                <div class="sideButtons">
                    <button class="transBtns" id="zoomIn" title="Zoom In (+)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/plus.png"></button>
                    <button class="transBtns" id="revertPos" title="Refocus (Enter)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/target.png" style="opacity:0.1;"></button>
                    <button class="transBtns" id="seeAll" title="Big Board View (A)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/seeall.png"></button>
                    <button class="transBtns" id="zoomOut" title="Zoom Out (-)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/minus.png"></button>
                    <button class="transBtns" id="fullscreen" title="Fullscreen (F)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/fs.png"></button>
                    <button class="transBtns" id="screenshotURL" title="Screenshot (S)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/camera.png"></button>
                    <button class="transBtns" id="timeStampURL" title="Link and Code (L)">
                        <img src="http://web.mit.edu/lu16j/www/WebPentimento/images/link.png"></button>
                    <div class='URLinfo'>
                        <button id='linkbutton'>State-saved URL</button>
                        <button id='embedbutton'>Embed</button><br/>
                        <textarea class='URLs' readonly='readonly' rows='1' cols='35' wrap='off'></textarea>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
"""
htmlFile.write(template)
htmlFile.close()

lecFile = open(lecture,'r')
jsFile = open(name+'.js','w')
jsFile.write('var lecture = ')
for line in lecFile:
    jsFile.write(line);
jsFile.write(';')

lecFile.close()
jsFile.close()
