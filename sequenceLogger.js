window["LOGGER"] = {};
window["LOGGER"]["log"] = true;
window["LOGGER"]["ignoredClasses"] = ["LOGGER"];
window["LOGGER"]["ignoredMethods"] = [];
window["LOGGER"]["sequence"] = [];
window["LOGGER"]["prevElement"] = null;
window["LOGGER"]["generateSequence"] = function(title){
  var arr = ["Title : "+title];
  var prev = null;
  window["LOGGER"]["sequence"].forEach(function(element){
    if(prev){
      if(element["caller"]!== "WINDOW"){
      arr.push("Note right of "+prev["caller"]+" : "+prev["func"]);
      var argsStr = element["args"].length > 0 ?  "("+element["args"].join(",")+")" : "";
      arr.push(prev["caller"] + " -> " + element["caller"]+" : "+element["func"]+argsStr);
     }
    }
    prev = element;
  });
  return arr.join("\n");
};
window["LOGGER"]["logGenerator"] = function(callerName , functionName , arguments){
 var args = [];
 for(var i = 0 ; i < arguments.length ;i++){
    args.push(typeof arguments[i]);
  };
  return {"caller":callerName,"func":functionName,"args":args};
};
window["LOGGER"]["getFunctionLogged"] = function(caller, func , name){
  return function() {
        if (window["LOGGER"]["log"]) {
          if(window["LOGGER"]["ignoredClasses"].indexOf(caller) === -1){
            if(window["LOGGER"]["ignoredMethods"].indexOf(name) === -1){
              window["LOGGER"]["sequence"].push(window["LOGGER"]["logGenerator"](caller, name,arguments));
             }
          }
        }
        return func.apply(this, arguments);
    }
};
window["LOGGER"]["addClassForLogging"] = function(target){
  var targets = Object.getOwnPropertyNames (target);
  targets.forEach(function(name){
    var toLog = target[name];
    if(Object.prototype.toString.call(toLog) === '[object Object]'){
      window["LOGGER"]["addClassForLogging"](toLog);
    }else if(Object.prototype.toString.call(toLog) === '[object Function]'){
        target[name] = window["LOGGER"].getFunctionLogged(target.constructor.name , toLog, name);
    }else if(toLog && toLog.constructor === Array){
      toLog.forEach(function(arrElement){
        window["LOGGER"]["addClassForLogging"](arrElement);
      });
    }
  });

};
window["LOGGER"]["clearAndRecordForMinutes"] = function(name , minutes , seconds , handler){
   window["LOGGER"]["log"] = true;
   window["LOGGER"]["sequence"] = [];
   var recordingName = name?name:"Recording at "+Date.now();
   var secs = minutes*60+seconds;
   setTimeout(function(){
      clearInterval(interval);
      handler(window["LOGGER"]["generateSequence"](recordingName));
   },
   secs*1000);
   var interval = setInterval(function(){console.log(--secs);},1000);
};