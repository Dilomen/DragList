var DragList = (function () {
	'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var runtime_1 = createCommonjsModule(function (module) {
	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	var runtime = (function (exports) {

	  var Op = Object.prototype;
	  var hasOwn = Op.hasOwnProperty;
	  var undefined$1; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	    var generator = Object.create(protoGenerator.prototype);
	    var context = new Context(tryLocsList || []);

	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);

	    return generator;
	  }
	  exports.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  // This is a polyfill for %IteratorPrototype% for environments that
	  // don't natively support it.
	  var IteratorPrototype = {};
	  IteratorPrototype[iteratorSymbol] = function () {
	    return this;
	  };

	  var getProto = Object.getPrototypeOf;
	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  if (NativeIteratorPrototype &&
	      NativeIteratorPrototype !== Op &&
	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	    // This environment has a native %IteratorPrototype%; use it instead
	    // of the polyfill.
	    IteratorPrototype = NativeIteratorPrototype;
	  }

	  var Gp = GeneratorFunctionPrototype.prototype =
	    Generator.prototype = Object.create(IteratorPrototype);
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] =
	    GeneratorFunction.displayName = "GeneratorFunction";

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      prototype[method] = function(arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }

	  exports.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };

	  exports.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      if (!(toStringTagSymbol in genFun)) {
	        genFun[toStringTagSymbol] = "GeneratorFunction";
	      }
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
	  // meant to be awaited.
	  exports.awrap = function(arg) {
	    return { __await: arg };
	  };

	  function AsyncIterator(generator, PromiseImpl) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value &&
	            typeof value === "object" &&
	            hasOwn.call(value, "__await")) {
	          return PromiseImpl.resolve(value.__await).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }

	        return PromiseImpl.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration.
	          result.value = unwrapped;
	          resolve(result);
	        }, function(error) {
	          // If a rejected Promise was yielded, throw the rejection back
	          // into the async generator function so it can be handled there.
	          return invoke("throw", error, resolve, reject);
	        });
	      }
	    }

	    var previousPromise;

	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new PromiseImpl(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }

	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);
	  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
	    return this;
	  };
	  exports.AsyncIterator = AsyncIterator;

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
	    if (PromiseImpl === void 0) PromiseImpl = Promise;

	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList),
	      PromiseImpl
	    );

	    return exports.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      context.method = method;
	      context.arg = arg;

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          var delegateResult = maybeInvokeDelegate(delegate, context);
	          if (delegateResult) {
	            if (delegateResult === ContinueSentinel) continue;
	            return delegateResult;
	          }
	        }

	        if (context.method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = context.arg;

	        } else if (context.method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw context.arg;
	          }

	          context.dispatchException(context.arg);

	        } else if (context.method === "return") {
	          context.abrupt("return", context.arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;

	          if (record.arg === ContinueSentinel) {
	            continue;
	          }

	          return {
	            value: record.arg,
	            done: context.done
	          };

	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(context.arg) call above.
	          context.method = "throw";
	          context.arg = record.arg;
	        }
	      }
	    };
	  }

	  // Call delegate.iterator[context.method](context.arg) and handle the
	  // result, either by returning a { value, done } result from the
	  // delegate iterator, or by modifying context.method and context.arg,
	  // setting context.delegate to null, and returning the ContinueSentinel.
	  function maybeInvokeDelegate(delegate, context) {
	    var method = delegate.iterator[context.method];
	    if (method === undefined$1) {
	      // A .throw or .return when the delegate iterator has no .throw
	      // method always terminates the yield* loop.
	      context.delegate = null;

	      if (context.method === "throw") {
	        // Note: ["return"] must be used for ES3 parsing compatibility.
	        if (delegate.iterator["return"]) {
	          // If the delegate iterator has a return method, give it a
	          // chance to clean up.
	          context.method = "return";
	          context.arg = undefined$1;
	          maybeInvokeDelegate(delegate, context);

	          if (context.method === "throw") {
	            // If maybeInvokeDelegate(context) changed context.method from
	            // "return" to "throw", let that override the TypeError below.
	            return ContinueSentinel;
	          }
	        }

	        context.method = "throw";
	        context.arg = new TypeError(
	          "The iterator does not provide a 'throw' method");
	      }

	      return ContinueSentinel;
	    }

	    var record = tryCatch(method, delegate.iterator, context.arg);

	    if (record.type === "throw") {
	      context.method = "throw";
	      context.arg = record.arg;
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    var info = record.arg;

	    if (! info) {
	      context.method = "throw";
	      context.arg = new TypeError("iterator result is not an object");
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    if (info.done) {
	      // Assign the result of the finished delegate to the temporary
	      // variable specified by delegate.resultName (see delegateYield).
	      context[delegate.resultName] = info.value;

	      // Resume execution at the desired location (see delegateYield).
	      context.next = delegate.nextLoc;

	      // If context.method was "throw" but the delegate handled the
	      // exception, let the outer generator proceed normally. If
	      // context.method was "next", forget context.arg since it has been
	      // "consumed" by the delegate iterator. If context.method was
	      // "return", allow the original .return call to continue in the
	      // outer generator.
	      if (context.method !== "return") {
	        context.method = "next";
	        context.arg = undefined$1;
	      }

	    } else {
	      // Re-yield the result returned by the delegate method.
	      return info;
	    }

	    // The delegate iterator is finished, so forget it and continue with
	    // the outer generator.
	    context.delegate = null;
	    return ContinueSentinel;
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  Gp[toStringTagSymbol] = "Generator";

	  // A Generator should always return itself as the iterator object when the
	  // @@iterator function is called on it. Some browsers' implementations of the
	  // iterator prototype chain incorrectly implement this, causing the Generator
	  // object to not be returned from this call. This ensures that doesn't happen.
	  // See https://github.com/facebook/regenerator/issues/274 for more details.
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };

	  Gp.toString = function() {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  exports.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined$1;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  exports.values = values;

	  function doneResult() {
	    return { value: undefined$1, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined$1;
	      this.done = false;
	      this.delegate = null;

	      this.method = "next";
	      this.arg = undefined$1;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined$1;
	          }
	        }
	      }
	    },

	    stop: function() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;

	        if (caught) {
	          // If the dispatched exception was caught by a catch block,
	          // then let that catch block handle the exception normally.
	          context.method = "next";
	          context.arg = undefined$1;
	        }

	        return !! caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }

	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.method = "next";
	        this.next = finallyEntry.finallyLoc;
	        return ContinueSentinel;
	      }

	      return this.complete(record);
	    },

	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = this.arg = record.arg;
	        this.method = "return";
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }

	      return ContinueSentinel;
	    },

	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      if (this.method === "next") {
	        // Deliberately forget the last sent value so that we don't
	        // accidentally pass it on to the delegate.
	        this.arg = undefined$1;
	      }

	      return ContinueSentinel;
	    }
	  };

	  // Regardless of whether this script is executing as a CommonJS module
	  // or not, return the runtime object so that we can declare the variable
	  // regeneratorRuntime in the outer scope, which allows this module to be
	  // injected easily by `bin/regenerator --include-runtime script.js`.
	  return exports;

	}(
	  // If this script is executing as a CommonJS module, use module.exports
	  // as the regeneratorRuntime namespace. Otherwise create a new empty
	  // object. Either way, the resulting object will be used to initialize
	  // the regeneratorRuntime variable at the top of this file.
	   module.exports 
	));

	try {
	  regeneratorRuntime = runtime;
	} catch (accidentalStrictMode) {
	  // This module should not be running in strict mode, so the above
	  // assignment should always work unless something is misconfigured. Just
	  // in case runtime.js accidentally runs in strict mode, we can escape
	  // strict mode using a global Function call. This could conceivably fail
	  // if a Content Security Policy forbids using Function, but in that case
	  // the proper solution is to fix the accidental strict mode problem. If
	  // you've misconfigured your bundler to force strict mode and applied a
	  // CSP to forbid Function, and you're not willing to fix either of those
	  // problems, please detail your unique predicament in a GitHub issue.
	  Function("r", "regeneratorRuntime = r")(runtime);
	}
	});

	var regenerator = runtime_1;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
	  try {
	    var info = gen[key](arg);
	    var value = info.value;
	  } catch (error) {
	    reject(error);
	    return;
	  }

	  if (info.done) {
	    resolve(value);
	  } else {
	    Promise.resolve(value).then(_next, _throw);
	  }
	}

	function _asyncToGenerator(fn) {
	  return function () {
	    var self = this,
	        args = arguments;
	    return new Promise(function (resolve, reject) {
	      var gen = fn.apply(self, args);

	      function _next(value) {
	        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
	      }

	      function _throw(err) {
	        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
	      }

	      _next(undefined);
	    });
	  };
	}

	var asyncToGenerator = _asyncToGenerator;

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var defineProperty = _defineProperty;

	/**
	 * 将传入文件base64编码转成文件类型
	 * @param {String} dataurl 传入的文件base64编码
	 * @param {String} filename 文件名
	 * @param {String} type 文件类型
	 */
	/**
	 * 获取父级元素
	 * @param {*} ele 指定元素
	 */

	function getParentElement(ele) {
	  if (!(ele instanceof HTMLElement)) throw new Error("请传入正确的元素");
	  return ele.parentNode === document ? null : ele.parentNode;
	}
	function nextElement(el) {
	  return el.nextElementSibling || nextSiblingWithElement(); // 过滤文本，注释节点

	  function nextSiblingWithElement() {
	    var sibling = el;

	    do {
	      sibling = sibling.nextSibling;
	    } while (sibling && sibling.nodeType !== 1);

	    return sibling;
	  }
	}
	/**
	 * 代理加载图片
	 */
	// let myImage = (function() {
	//   let imgNode = document.createElement('img')
	//   document.body.appendChild(imgNode);
	//   return {
	//     setSrc: function(src) {
	//       imgNode.src = src;
	//     }
	//   }
	// })()
	// let proxyImage = (function() {
	//   let img = new Image()
	//   img.onload = function() {
	//     myImage.setSrc(this.src)
	//   }
	//   return {
	//     setSrc: function(src) {
	//       myImage.setSrc('loading.gif')
	//       img.src = src
	//     }
	//   }
	// })
	// export function lazyLoadImage(element) {
	//   if (getScrollTop(element) <= getScrollTop()) {
	//     element.setAttribute(src, element.getAttribute("data-src"));
	//   }
	// }

	/**
	 * 执行方法
	 * @param func
	 * @param params
	 * @returns {*}
	 */
	var tryFunc = function tryFunc(func) {
	  if (func instanceof Function) {
	    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      params[_key - 1] = arguments[_key];
	    }

	    return func.apply(void 0, params);
	  }

	  return func;
	};
	/**
	 * 执行promise方法
	 * @param func 传入执行的函数
	 * @param params 传入的参数
	 * @returns {Promise<any>} 返回的Promise对象
	 */

	var tryPromiseFunc = function tryPromiseFunc(func) {
	  for (var _len2 = arguments.length, params = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	    params[_key2 - 1] = arguments[_key2];
	  }

	  return new Promise(function (resolve, reject) {
	    try {
	      var res = tryFunc.apply(void 0, [func].concat(params));

	      if (res instanceof Promise) {
	        res.then(function (data) {
	          return resolve(data);
	        })["catch"](function (err) {
	          return reject(err);
	        });
	      } else {
	        resolve(res);
	      }
	    } catch (err) {
	      reject(err);
	    }
	  });
	};
	/**
	 * 获取url路径上的键值对
	 * @param url
	 * @return {URLSearchParams} 返回一个实例
	 */

	var searchParams = new URLSearchParams(location.search.replace(/\?/gi, ""));

	var toString = Object.prototype.toString; // 是否是一个数组

	var isArray = function isArray(value) {
	  return Array.isArray(value) || toString.call(value) === "[object Array]";
	}; // 是否是一个对象

	/**
	 * 判断是否是移动端
	 */
	function isMobile() {
	  var mobileArry = ["iPhone", "iPad", "Android", "Windows Phone", "BB10; Touch", "BB10; Touch", "PlayBook", "Nokia"];
	  var ua = navigator.userAgent;
	  var res = mobileArry.filter(function (arr) {
	    return ua.indexOf(arr) > 0;
	  });
	  return res.length > 0;
	}
	/**
	 * 获取鼠标位置
	 * @param {Object} e 事件对象
	 * @param {String} eventName 事件名称
	 */

	function getSite(e, eventName) {
	  var _x;

	  var _y;

	  if (eventName === "touchend") {
	    _x = e.changedTouches[0].clientX;
	    _y = e.changedTouches[0].clientY;
	    return {
	      clientX: _x,
	      clientY: _y
	    };
	  }

	  if (isMobile()) {
	    _x = e.touches[0].clientX;
	    _y = e.touches[0].clientY;
	  } else {
	    _x = e.clientX;
	    _y = e.clientY;
	  }

	  return {
	    clientX: _x,
	    clientY: _y
	  };
	}
	/**
	 * 获取div到可视窗口最左边的距离，除去margin
	 * @param {*} element
	 */

	function getElementSite(ele) {
	  var _oDivObj = ele.getBoundingClientRect();

	  return _oDivObj;
	}
	/**
	 * 根据环境选择事件
	 */

	function chooseEvent() {
	  var mouse = {
	    mousedown: "mousedown",
	    mousemove: "mousemove",
	    mouseup: "mouseup"
	  };
	  var touch = {
	    mousedown: "touchstart",
	    mousemove: "touchmove",
	    mouseup: "touchend"
	  };
	  return isMobile() ? touch : mouse;
	}
	function bindEvent(ele, event, fn) {
	  if (ele.addEventListener) {
	    return ele.addEventListener(event, fn, false);
	  }

	  ele.attachEvent("on" + event, fn);
	}
	function removeEvent(ele, event, fn) {
	  if (ele.removeEventListener) {
	    return ele.removeEventListener(event, fn, false);
	  }

	  ele.removeEvent("on" + event, fn);
	}
	/**
	 * 防止mousemove时选中文本
	 */

	function prohibitSelectText() {
	  window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
	}

	function styleInject(css, ref) {
	  if ( ref === void 0 ) ref = {};
	  var insertAt = ref.insertAt;

	  if (!css || typeof document === 'undefined') { return; }

	  var head = document.head || document.getElementsByTagName('head')[0];
	  var style = document.createElement('style');
	  style.type = 'text/css';

	  if (insertAt === 'top') {
	    if (head.firstChild) {
	      head.insertBefore(style, head.firstChild);
	    } else {
	      head.appendChild(style);
	    }
	  } else {
	    head.appendChild(style);
	  }

	  if (style.styleSheet) {
	    style.styleSheet.cssText = css;
	  } else {
	    style.appendChild(document.createTextNode(css));
	  }
	}

	var css_248z = ".dark-tranmit {\n  opacity: 0.2;\n  position: fixed;\n  pointer-events: none;\n  z-index: 9999;\n}\n\n.dark-mirror {\n  opacity: .5;\n}\n\n";
	styleInject(css_248z);

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
	var doc = document.documentElement;
	var containers = [];
	var _startX = 0;
	var _startY = 0;
	var currentNodeLeft = 0;
	var currentNodeTop = 0;
	var currentNode = null;
	var copyNode = null;
	var pointNode = null;
	var source = null;
	var isClickEvent = false;
	var config = {
	  isCopy: true,
	  inContainer: true
	};
	var observer = Observer();
	var events = chooseEvent();
	var isCopyNode = true; // 注册监听事件

	function Observer() {
	  var listener = {};
	  var listenEvents = ["drop", "dropstart", "droping"];

	  function emit(name) {
	    if (!has(name)) return;

	    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	      args[_key - 1] = arguments[_key];
	    }

	    return tryPromiseFunc.apply(void 0, [listener[name]].concat(args));
	  }

	  function has(name) {
	    return name in listener;
	  }

	  function on(name, fn) {
	    if (!listenEvents.includes(name)) throw new Error("请输入正确的监听事件,如:drop, dropstart, droping");
	    listener[name] = fn;
	  }

	  function destory() {
	    listener = {};
	    config = {
	      isCopy: true,
	      inContainer: true
	    };
	    clear();
	    removeEvent(doc, events["mousedown"], docMouseDown);
	  }

	  return {
	    emit: emit,
	    on: on,
	    destory: destory,
	    has: has
	  };
	}

	function Dragula(initContainers, options) {
	  config = _objectSpread({}, config, {}, options);
	  isCopyNode = isCopy();
	  containers = isArray(initContainers) ? initContainers : [initContainers];
	  bindEvent(doc, "click", docClick);
	  bindEvent(doc, events["mousedown"], docMouseDown);
	  return observer;
	} // 是否需要复制元素，优先配置方法


	function isCopy() {
	  if (config && (config.isCopy === false || tryFunc(config.isCopy) === false)) {
	    return false;
	  }

	  return true;
	} // 是否需要复制元素，优先配置方法


	function isContainer(ele) {
	  if (config && (config.isContainer === false || tryFunc(config.isContainer, ele) === false)) {
	    return false;
	  }

	  return containers.includes(ele);
	}

	function findContainerChild(node) {
	  if (node === document.documentElement || !(node instanceof HTMLElement)) return false;
	  var parentNode = getParentElement(node);

	  if (isContainer(parentNode)) {
	    return node;
	  } else {
	    return findContainerChild(parentNode);
	  }
	}

	function docClick(e) {
	  isClickEvent = true;
	} // document注册mousedown监听事件


	function docMouseDown(e) {
	  // 当元素执行click事件时，阻止onmousedown执行的内容
	  isClickEvent = false;
	  setTimeout( /*#__PURE__*/asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee() {
	    var node, sibling, isContinue, elementSite;
	    return regenerator.wrap(function _callee$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            _startX = getSite(e).clientX;
	            _startY = getSite(e).clientY;
	            node = document.elementFromPoint(_startX, _startY);
	            node = findContainerChild(node);

	            if (!(node && node instanceof HTMLElement)) {
	              _context.next = 17;
	              break;
	            }

	            currentNode = node;
	            source = getParentElement(node);
	            sibling = nextElement(node);
	            _context.next = 10;
	            return observer.emit("dropstart", currentNode, source, sibling);

	          case 10:
	            isContinue = _context.sent;

	            if (!(isContinue === false)) {
	              _context.next = 13;
	              break;
	            }

	            return _context.abrupt("return", false);

	          case 13:
	            elementSite = getElementSite(currentNode);
	            currentNodeLeft = elementSite.x;
	            currentNodeTop = elementSite.y;
	            docMouseEvent();

	          case 17:
	          case "end":
	            return _context.stop();
	        }
	      }
	    }, _callee);
	  })), 200);
	}

	function docMouseEvent(remove) {
	  if (remove) {
	    removeEvent(doc, events["mouseup"], drop);
	    removeEvent(doc, events["mousemove"], drag);
	  } else {
	    if (isClickEvent) return false;
	    bindEvent(doc, events["mouseup"], drop);
	    bindEvent(doc, events["mousemove"], drag);
	  }
	} // 拖拉元素


	function drag(_x) {
	  return _drag.apply(this, arguments);
	} // 放下元素


	function _drag() {
	  _drag = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(e) {
	    var dragX, dragY, result, parent, clientHeight, elementSite, offsetTop, pointNodeNext, isContinue, _isContinue;

	    return regenerator.wrap(function _callee3$(_context3) {
	      while (1) {
	        switch (_context3.prev = _context3.next) {
	          case 0:
	            _isContinue = function _isContinue3() {
	              _isContinue = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2() {
	                var target, isContinueDefultExecute;
	                return regenerator.wrap(function _callee2$(_context2) {
	                  while (1) {
	                    switch (_context2.prev = _context2.next) {
	                      case 0:
	                        if (!observer.has("droping")) {
	                          _context2.next = 7;
	                          break;
	                        }

	                        target = pointNode && (isContainer(pointNode) ? pointNode : getParentElement(pointNode));
	                        _context2.next = 4;
	                        return observer.emit("droping", currentNode, pointNode, target, source);

	                      case 4:
	                        isContinueDefultExecute = _context2.sent;

	                        if (!(isContinueDefultExecute === false)) {
	                          _context2.next = 7;
	                          break;
	                        }

	                        return _context2.abrupt("return", false);

	                      case 7:
	                        return _context2.abrupt("return", true);

	                      case 8:
	                      case "end":
	                        return _context2.stop();
	                    }
	                  }
	                }, _callee2);
	              }));
	              return _isContinue.apply(this, arguments);
	            };

	            isContinue = function _isContinue2() {
	              return _isContinue.apply(this, arguments);
	            };

	            dragX = getSite(e).clientX;
	            dragY = getSite(e).clientY;

	            if (isCopyNode) {
	              if (!copyNode && (Math.abs(dragY - _startY) > 10 || Math.abs(dragX - _startX) > 10)) {
	                copyNode = currentNode.cloneNode(true);
	                copyNode.classList.add("dark-tranmit");
	                copyNode.style.top = currentNodeTop + "px";
	                copyNode.style.left = currentNodeLeft + "px";
	                currentNode.classList.add("dark-mirror");
	                document.body.appendChild(copyNode);
	              }

	              if (copyNode) {
	                copyNode.style.top = currentNodeTop + (dragY - _startY) + "px";
	                copyNode.style.left = currentNodeLeft + (dragX - _startX) + "px";
	              }
	            }

	            pointNode = document.elementFromPoint(dragX, dragY);

	            if (!isContainer(pointNode)) {
	              _context3.next = 15;
	              break;
	            }

	            _context3.next = 9;
	            return isContinue();

	          case 9:
	            result = _context3.sent;

	            if (result) {
	              _context3.next = 12;
	              break;
	            }

	            return _context3.abrupt("return", false);

	          case 12:
	            pointNode && pointNode.appendChild(currentNode);
	            _context3.next = 22;
	            break;

	          case 15:
	            pointNode = findContainerChild(pointNode);
	            _context3.next = 18;
	            return isContinue();

	          case 18:
	            result = _context3.sent;

	            if (result) {
	              _context3.next = 21;
	              break;
	            }

	            return _context3.abrupt("return", false);

	          case 21:
	            if (pointNode) {
	              parent = getParentElement(pointNode);
	              clientHeight = pointNode.clientHeight;
	              elementSite = getElementSite(pointNode);
	              offsetTop = elementSite.y;

	              if (dragY < offsetTop + clientHeight / 2) {
	                parent.insertBefore(currentNode, pointNode);
	              } else if (dragY < offsetTop + clientHeight && dragY > offsetTop + clientHeight / 2) {
	                pointNodeNext = nextElement(pointNode);

	                if (pointNodeNext) {
	                  parent.insertBefore(currentNode, pointNodeNext);
	                } else {
	                  parent.appendChild(currentNode);
	                }
	              }
	            }

	          case 22:
	            prohibitSelectText();

	          case 23:
	          case "end":
	            return _context3.stop();
	        }
	      }
	    }, _callee3);
	  }));
	  return _drag.apply(this, arguments);
	}

	function drop(_x2) {
	  return _drop.apply(this, arguments);
	}

	function _drop() {
	  _drop = asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(e) {
	    var dropX, dropY, target, sibling;
	    return regenerator.wrap(function _callee4$(_context4) {
	      while (1) {
	        switch (_context4.prev = _context4.next) {
	          case 0:
	            dropX = getSite(e).clientX;
	            dropY = getSite(e).clientY;
	            target = pointNode && (isContainer(pointNode) ? pointNode : getParentElement(pointNode));
	            sibling = nextElement(currentNode);

	            if (Math.abs(dropY - _startY) > 15 || Math.abs(dropX - _startX) > 15) {
	              observer.emit("drop", currentNode, source, target, sibling);
	            }

	            docMouseEvent(true);
	            currentNode && currentNode.classList.remove("dark-mirror");

	            if (isCopyNode && copyNode) {
	              document.body.removeChild(copyNode);
	            }

	            clear();

	          case 9:
	          case "end":
	            return _context4.stop();
	        }
	      }
	    }, _callee4);
	  }));
	  return _drop.apply(this, arguments);
	}

	function clear() {
	  currentNode = null;
	  copyNode = null;
	  source = null;
	  pointNode = null;
	}

	return Dragula;

}());
