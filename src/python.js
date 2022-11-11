//!
//! Python module
//!
//! This module is responsible for the main Python kernel interface to Pyodide.
//!
//! It spawns a worker thread and connects to Pyodide with correct setup. The interface
//! here allows creating multiple states, duplicating states, and evaluating Python
//! code from a state. Note that evaluation is stateful, that is, it may modify the
//! state given. Creating fresh states should always be possible. Duplicating states
//! should normally be possible, but because a deep copy must be done there is the
//! possibility of types existing in the source state that cannot be effectively duplicated.
//! If this happens the state duplication may fail.
//!
//! Create new kernel with newPythonKernel (see documentation of API there)
//!

import { signalMap, setStarting, clearInterrupt,
         sharedArray, sharedInputArray, setIOComplete, INPUT_BUFFER_SIZE
       } from './signal.js';

// Spawn the web worker thread and configure it
function newPythonWorker() {
    const config = {
        absurl: document.location.origin,
        sharedArray: sharedArray,
        sharedInputArray: sharedInputArray,
        signalMap: signalMap,
        INPUT_BUFFER_SIZE: INPUT_BUFFER_SIZE,
    };

    let worker = new Worker('build/worker.js');
    worker.postMessage(config);

    worker.on = function(type, handler) {
        if (type === 'message') {
            worker.onmessage = function(e) {
                handler(e.data);
            };
            return worker;
        }
        if (type === 'error') {
            worker.onerror = handler;
            console.log('error in spawned thread');
            return worker;
        }
        if (type === 'terminate') {
            worker._onterminate = handler;
        }
        throw 'Unknown message type ' + type;
    };

    // Set starting, worker will clear when ready
    setStarting();
    return worker;
}

//!
//! \brief Find one handler in dict with fallback opts
//!
//! Given one main dictionary of handlers, and a fallback options
//! dictionary, find the handler for name. If neither one has it,
//! return the defaultHandler.
//!
function findHandler(name, callback, opts, defaultHandler) {
    if (callback !== undefined && callback[name] !== undefined) {
        return callback[name];
    }
    if (opts[name] !== undefined) {
        return opts[name];
    }
    return defaultHandler;
}

//!
//! \brief Create a new Python kernel with given options.
//!
//! The interface to the Python kernel is asynchronous here. The work is done in a
//! worker thread (where the Python interface is synchronous). When evaluating Python
//! code, the kernel may do a bunch of work and then later call output methods
//! asynchronously. The Python code may loop forever (and need to be interrupted).
//!
//! Interrupts are handled with a Shared Array Buffer organized in signal.js.
//!
//! The kernel object and options are callback based. In general the output callbacks
//! operate on a line-based approach. For example, the message passed to onStdout is
//! assumed to be terminated with a newline. Python normally assumed that output can be
//! flushed without a terminating newline, so this is a slight disconnect.
//!
//! In the Python library pbexec this disconnect is handled with WriteBuffer and ReadBuffer.
//! There a WriteBuffer writes line by line to onStdout. An explicit flush() outputs the
//! partial line in the existing buffer. This allows interactive Python code to work and
//! for the user to see the output, even if the newlines are not exactly correct (e.g. for prompts).
//!
//! For evaluation, there is not one "evaluated value". The pbexec Python library handles
//! evaluation. In general the evaluation function will work through statements in cell and
//! output result values if they are not None. Handled in wrapped_run_cell of pbexec.
//!
//! Arguments:
//! - opts - A dictionary with optional default handlers for Python output
//!     - onReady(msg) - Method to call once kernel is ready
//!     - onStdout(msg) - Method to call for one line of stdout
//!     - onStderr(msg) - Method to call for one line of stderr
//!     - onOutput(content_type, data) - Method to call for rich MIME-type output
//!     - onResponse() - Method to call once request is finished (e.g. when state is duplicated, or evaluation is finished)
//!
//! Returned object has the following methods. All methods have callback argument, is a dictionary of optional
//! handlers as in opts above. Typical use is to override at least onResponse for asynchronous response.
//!
//! Methods:
//! - evaluate(expr, name, callback) - Evaluate expr in state name.
//! - freshstate(name, callback) - Make name into a fresh blank Python state. Overrides any existing value there.
//! - duplicatestate(oldName, newName, callback) - Duplicate state from oldName to newName.
//! - deletestate(name, callback) - Delete state name, free any used memory.
//! - terminate() - Terminate web worker thread, restart and reconfigure. This is heavier than a normal interrupt of an evaluation.
//!

export function newPythonKernel(opts) {

    // Fill out option defaults
    if (opts === undefined) {
        opts = {};
    }
    if (opts.onReady === undefined) {
        opts.onReady = function(msg) {
            console.log('Python Ready\n' + msg);
        };
    }
    if (opts.onStdout === undefined) {
        opts.onStdout = function(msg) {
            console.log(msg);
        };
    }
    if (opts.onStderr === undefined) {
        opts.onStderr = function(msg) {
            console.warn(msg);
        };
    }
    if (opts.onOutput === undefined) {
        opts.onOutput = function(content_type, data) {
            console.log('Rich output', content_type, data);
        };
    }
    if (opts.onResponse === undefined) {
        opts.onResponse = function() {
            console.log('Response');
        };
    }
    if (opts.files === undefined) {
        opts.files = [];
    }

    var callbacks = [];
    function startup() {
        var worker = newPythonWorker();
        worker.on('message', function(msg) {
            const defaultHandler = function() { console.log('default handler'); };
            const callback = callbacks;
            if (msg.type === 'ready') {
                findHandler('onReady', callback, opts, defaultHandler)(msg.data);
            } else if (msg.type === 'stdout') {
                findHandler('onStdout', callback, opts, defaultHandler)(msg.data);
                setIOComplete();
            } else if (msg.type === 'stderr') {
                findHandler('onStderr', callback, opts, defaultHandler)(msg.data);
                setIOComplete();
            } else if (msg.type === 'output') {
                findHandler('onOutput', callback, opts, defaultHandler)(msg.content_type, msg.data);
                setIOComplete();
            } else if (msg.type === 'filesystem') {
                findHandler('onFilesystem', callback, opts, defaultHandler)();
                setIOComplete();
            } else if (msg.type === 'response') {
                findHandler('onResponse', callback, opts, defaultHandler)();
            } else {
                throw 'Unknown message type in main thread onmessage';
            }
        });
        return worker;
    }

    var worker = startup();

    return {
        evaluate: function(expr, name, options, callback) {
            callbacks = callback;
            worker.postMessage({ type:'execute', expr:expr, name:name, options:options });
        },
        setglobal: function(name, identifier, value, callback) {
            callbacks = callback;
            worker.postMessage({ type:'setglobal', name:name, identifier:identifier, value:value });
        },
        freshstate: function(name, callback) {
            callbacks = callback;
            worker.postMessage({ type:'freshstate', name:name });
        },
        duplicatestate: function(oldName, newName, callback) {
            callbacks = callback;
            worker.postMessage({ type:'duplicatestate', oldName:oldName, newName:newName });
        },
        deletestate: function(name, callback) {
            callbacks = callback;
            worker.postMessage({ type:'deletestate', name:name });
        },
        terminate: function() {
            worker.terminate();
            clearInterrupt();
            worker = startup();
        },
    };
}

