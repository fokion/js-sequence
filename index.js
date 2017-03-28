/**
 * Created by fokion on 27/03/2017.
 */
function MyAppImpl(){
    var me = this;

    function init(){
        console.log("Hello there");
    }
    var init  = init;

    function init2(){
        console.log("Hello there 2");
    }
    var init2 = init2;

    function loaded(){
        console.log("Loaded info");
        init();
        init2();
        printSequence();
    }
    me.loaded = loaded;
    function printSequence(){
        var seq = LOGGER.generateSequence("Elements in index");
        document.getElementById("seq").textContent = seq;
        var d = Diagram.parse(seq);
        var options = {theme: 'simple'};
        d.drawSVG('diagram', options);
    }
    init = window["LOGGER"]["innerFunctionForLogging"](me,init);
    init2 = window["LOGGER"]["innerFunctionForLogging"](me,init2);
    window["LOGGER"]["addClassForLogging"](me);
}
window.onload = function() {
    var MYAPP = new MyAppImpl();
    MYAPP.loaded();
}