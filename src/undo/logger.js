var console = console;
var console_log = function(){};
if (console) {
    console_log = console.log;
}
else {
    console = {log:null};
}
console.log = function(msg) {
    console_log(msg);
    //TODO: log messages to something else. A file on the server?
}