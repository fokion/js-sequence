window["LOGGER"] = {};
window["LOGGER"]["log"] = true;
window["LOGGER"]["ignoredClasses"] = [];
window["LOGGER"]["ignoredMethods"] = [];
window["LOGGER"]["sequence"] = [];
window["LOGGER"]["prevElement"] = null;
window["LOGGER"]["generateSequence"] = function(title){
  var arr = ["Title : "+title];
  var prev = null;
  window["LOGGER"]["sequence"].forEach(function(element){
    if(prev){
      arr.push("Note right of "+prev["caller"]+" : "+prev["func"]);
      arr.push(prev["caller"] + " -> " + element["caller"]+" : "+element["func"]+" {"+element["args"].join(",")+"}");
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
window["LOGGER"]["addClassForLogging"] = function(objectToRecord){
  for(var name in objectToRecord){
    var functionToLog = objectToRecord[name];
    if(Object.prototype.toString.call(functionToLog) === '[object Object]'){
      window["LOGGER"]["addClassForLogging"](functionToLog);
    }
    if(Object.prototype.toString.call(functionToLog) === '[object Function]'){
        objectToRecord[name] = window["LOGGER"].getFunctionLogged(objectToRecord.constructor.name , functionToLog, name);
    }
  }
};