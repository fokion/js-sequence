window["LOGGER"] = {};
window["LOGGER"]["log"] = true;
window["LOGGER"]["sequence"] = [];
window["LOGGER"]["logGenerator"] = function(callerName , functionName , notes){
  return callerName + '->' + functionName;
}
window["LOGGER"]["getFunctionLogged"] = function(caller, func , name){
  return function() {
        if (window["LOGGER"]["log"] ) {
            window["LOGGER"]["sequence"].push(window["LOGGER"]["logGenerator"](caller, name));
        }
        func.apply(this, arguments);
    }
};
window["LOGGER"]["addFunctionToLog"] = function(objectToRecord){
  for(var name in objectToRecord){
    var functionToLog = objectToRecord[name];
    if(Object.prototype.toString.call(functionToLog) === '[object Function]'){
        objectToRecord[name] = window["LOGGER"].getFunctionLogged(objectToRecord.constructor.name , functionToLog, name);
    }
  }
};