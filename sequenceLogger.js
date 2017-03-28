window["LOGGER"] = new function () {
  function Stack() {
    this.functionName = "";
    this.fileName = "";
    this.lineNumber = -1;
    this.columnNumber = -1;
    this.url = "";
    this.source = "";
  }

  function StackErrorParser() {
    var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
    var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;
    var me = this;
    me.parse = function (error) {
      if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
        return parseOpera(error);
      } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
        return parseChromeOrIE(error);
      } else if (error.stack) {
        return parseFFOrSafari(error);
      } else {
        throw new Error('Cannot parse given Error object');
      }
    };

    function extractLocation(url) {
      if (url.indexOf(':') === -1) {
        return [urlLike];
      }
      var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
      var cleanUrl = url.replace(/[\(\)]/g, '');
      var parts = regExp.exec(cleanUrl);
      var urlExp = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;
      var urlBase = urlExp.exec(cleanUrl);
      var jsFile;
      var base = urlBase[6];
      if (base) {
        var baseParts = base.split("/");
        jsFile = baseParts.pop();
      }
      return [parts[1], parts[2] || undefined, parts[3] || undefined, jsFile];
    }

    function parseChromeOrIE(error) {
      var filtered = error.stack.split('\n').filter(function (line) {
        return !!line.match(CHROME_IE_STACK_REGEXP);
      }, this);

      return filtered.map(function (line) {
        if (line.indexOf('(eval ') > -1) {
          // Throw away eval information until we implement stacktrace.js/stackframe#8
          line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
        }
        var tokens = line.replace(/^\s+/, '').replace(/\(eval code/g, '(').split(/\s+/).slice(1);
        tokens = tokens.map(function (token) {
          return (token !== "new") ? token : "";
        });
        var locationParts = extractLocation(tokens.pop());
        var functionName = tokens.join(' ').trim() || undefined;
        var locationUrl = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];
        var stack = new Stack();
        stack.functionName = functionName;
        stack.lineNumber = locationParts[1];
        stack.columnNumber = locationParts[2];
        stack.source = line;
        stack.url = locationUrl;
        stack.fileName = locationParts[3];
        return stack;
      });
    }

    function parseFFOrSafari(error) {
      var filtered = error.stack.split('\n').filter(function (line) {
        return !line.match(SAFARI_NATIVE_CODE_REGEXP);
      }, this);

      return filtered.map(function (line) {
        // Throw away eval information until we implement stacktrace.js/stackframe#8
        if (line.indexOf(' > eval') > -1) {
          line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
        }

        if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
          // Safari eval frames only have function names and nothing else
          return new StackFrame({
            functionName: line
          });
        } else {
          var tokens = line.split('@');
          var locationParts = extractLocation(tokens.pop());
          var functionName = tokens.join('@') || undefined;
          var stack = new Stack();
          stack.functionName = functionName;
          stack.url = locationParts[0];
          stack.fileName = locationParts[0];
          stack.lineNumber = locationParts[1];
          stack.columnNumber = locationParts[2];
          stack.source = line;
        }
      });
    }

    function parseOpera(error) {
      if (!error.stacktrace || (error.message.indexOf('\n') > -1 &&
          e.message.split('\n').length > error.stacktrace.split('\n').length)) {
        return parseOpera9(error);
      } else if (!e.stack) {
        return parseOpera10(e);
      } else {
        return parseOpera11(e);
      }
    }

    function parseOpera9(error) {
      var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
      var lines = e.message.split('\n');
      var result = [];
      for (var i = 2, len = lines.length; i < len; i += 2) {
        var match = lineRE.exec(lines[i]);
        if (match) {
          var stack = new Stack();
          stack.fileName = match[2];
          stack.url = stack.fileName;
          stack.lineNumber = match[1];
          stack.source = lines[i];
          result.push(stack);
      }
    }
    return result;
  }

  function parseOpera10(error) {
    var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
    var lines = e.stacktrace.split('\n');
    var result = [];
    for (var i = 0, len = lines.length; i < len; i += 2) {
      var match = lineRE.exec(lines[i]);
      if (match) {
        var stack = new Stack();
        stack.functionName = match[3] || undefined;
        stack.fileName = match[2];
        stack.lineNumber = match[1];
        stack.source = lines[i];
      }
      result.push(stack);
    }
    return result;
  }

  function parseOpera11(error) {
    return filtered.map(function (line) {
      var tokens = line.split('@');
      var locationParts = extractLocation(tokens.pop());
      var functionCall = (tokens.shift() || '');
      var functionName = functionCall
        .replace(/<anonymous function(: (\w+))?>/, '$2')
        .replace(/\([^\)]*\)/g, '') || undefined;
      var argsRaw;
      if (functionCall.match(/\(([^\)]*)\)/)) {
        argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
      }
      var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ?
        undefined : argsRaw.split(',');
      var stack = new Stack();
      stack.functionName = functionName;
      stack.fileName = location[3];
      stack.url = location[0];
      stack.lineNumber = location[1];
      stack.columnNumber = location[2];
      stack.source = line;
      return stack;
    });
  }


}




var isLogging = true;
var ignoredClasses = ["LOGGER"];
var ignoredMethods = [];
var sequenceHandler;
var sequence = [];
var stackType = Stack;
var errorParser = new StackErrorParser();
var ids = {};
var me = this;
me.setLogging = function (b) {
  isLogging = b;
};

me.addClassToIgnoredList = function (name) {
  if (name && typeof name === "string") {
    ignoredClasses.push(name);
  }
};

me.addMethodNameToIgnoredList = function (name) {
  if (name && typeof name === "string") {
    ignoredMethods.push(name);
  }
};

me.setSequenceParser = function (handler) {
  sequenceHandler = handler;
};

me.generateSequence = function (title) {
  if (!sequenceHandler) {
    sequenceHandler = defaultSequenceHandler;
  }
  return sequenceHandler(title);
};

var defaultSequenceHandler = function (title) {
  var stackIterator = function (stackElement) {
    if (prev) {
      return prev.fileName + "." + prev.functionName + "->" + stackElement.fileName + "." + stackElement.functionName + ": " + stackElement.functionName;
    }
    prev = stackElement;
  };
  var prev = null;
  var arr = ["Title : " + title, "participant window"].concat(
    sequence.map(stackIterator));
  return arr.join("\n");
};

me.setStackClass = function (type) {
  if (type && typeof type === "function") {
    stackType = type;
  }
};

me.addClassForLogging = function (target) {
  var targets = Object.getOwnPropertyNames(target);
  targets.forEach(function (name) {
    var toLog = target[name];
    if (Object.prototype.toString.call(toLog) === '[object Object]') {
      me.addClassForLogging(toLog);
    } else if (Object.prototype.toString.call(toLog) === '[object Function]') {
      target[name] = me.addMethodForLogging(toLog);
    } else if (toLog && toLog.constructor === Array) {
      toLog.forEach(function (arrElement) {
        me.addClassForLogging(arrElement);
      });
    }
  });
};

me.addMethodForLogging = function (func) {
  try {
    throw new Error('logger');
  } catch (ex) {
    console.log("record...");
    var trace = errorParser.parse(ex).reverse();
    //ignore current function 
    trace.pop();
    var lastElem = trace.pop();
    ids[lastElem.fileName + "_" + func.name] = lastElem;
  }

  return function () {
    if (isLogging) {
      try {
        throw new Error('logger');
      } catch (ex) {
        console.log("called...");
        var trace = errorParser.parse(ex).reverse();
        //ignore current function 
        trace.pop();
        sequence = sequence.concat(trace);
        var scope = sequence[sequence.length - 1];
        console.log(ids[scope.fileName + "_" + func.name]);
      }
    }
    return func.apply(this, arguments);
  }
}
};