var getTextModel = function() {
    "use strict"
    var initial_time = 0;
    var chars = [];
    var supported_styles = ['color', 'font-size', 'font'];

    var calculateAbsTime = function(char_index) {
        var time = initial_time; 
        for (var i = 0; i <= char_index; i++) {
            time += chars[i].rel_time;
        }
        return time;
    };
    
    var absolute_time_cache = {};

    // start - inclusive
    // end - exclusive
    var removeCacheRange = function(start, end) {
          if (end === undefined) {
              end = chars.length;
          }
          if (start === undefined) {
              start = 0;
          }
          for (var i = start; i < end; i++) {
              if (i in absolute_time_cache){
                  delete absolute_time_cache[i];
              }
          }          
    };
    
    var checkCharIndex = function(char_index) {
        if (char_index >= chars.length){
            throw invalidCharIndex(char_index);
        }
    };
    
    return {
        getAbsTime: function(char_index) {
            checkCharIndex(char_index);
            if (char_index in absolute_time_cache) {
                return absolute_time_cache[char_index];
            }
            var time = calculateAbsTime(char_index);
            absolute_time_cache[char_index] = time;
            return time;
        },
        getAbsDelTime: function(char_index) {
            checkCharIndex(char_index);
            if (chars[char_index].del_time === null) {
                return null;
            }
            return self.getAbsTime(char_index) + chars[char_index].del_time;
        },
        insertChar: function(character, relative_time, styles, char_index) {
            if (styles === undefined) {
                styles = {};
            }
            var char_obj = {
                character: character,
                rel_time: relative_time,
                styles: styles,
                del_time: null
            };
            if (char_index === undefined || char_index === chars.length) {
                chars.push(char_obj);
            } else {
                checkCharIndex(char_index);
                chars.splice(char_index, 0, char_obj);
                removeCacheRange(char_index);
            }
        },
        deleteCharPerm: function(char_index) {
            checkCharIndex(char_index);
            chars.splice(char_index, 1);
        },
        //deletion_time is relative to when the character was inserted
        deleteCharRec: function(char_index, deletion_time)  {
            checkCharIndex(char_index);
            chars[char_index].del_time = deletion_time;
        },
        formatChar: function(char_index, style_property, value) {  // Currently no error checking for value
            checkCharIndex(char_index);
            if (!(style_property in supported_styles)) {
                throw invalidStyleProp(style_property);
            }
            chars[char_index].styles[style_property] = value;
        },
        getChars: function() {return chars}
    };
}
