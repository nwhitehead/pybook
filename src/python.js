import { signalMap, setStarting, clearInterrupt,
         sharedArray, sharedInputArray, INPUT_BUFFER_SIZE
       } from './signal.js';

// Spawn the web worker thread and configure it
function newPythonWorker() {
    const config = {
        absurl: document.location.protocol + '//' + document.location.host,
        sharedArray: sharedArray,
        sharedInputArray: sharedInputArray,
        signalMap: signalMap,
        INPUT_BUFFER_SIZE: INPUT_BUFFER_SIZE,
    };

    let worker = new Worker('worker.js');
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
        opts.onResponse = function(content_type, data) {
            console.log('Response', content_type, data);
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
            } else if (msg.type === 'stderr') {
                findHandler('onStderr', callback, opts, defaultHandler)(msg.data);
            } else if (msg.type === 'output') {
                findHandler('onOutput', callback, opts, defaultHandler)(msg.content_type, msg.data);
            } else if (msg.type === 'filesystem') {
                findHandler('onFilesystem', callback, opts, defaultHandler)();
            } else if (msg.type === 'response') {
                findHandler('onResponse', callback, opts, defaultHandler)(msg.state);
            } else {
                throw 'Unknown message type in main thread onmessage';
            }
        });
        return worker;
    }

    var worker = startup();

    return {
        evaluate: function(expr, state, callback) {
            callbacks = callback;
            worker.postMessage({ type:'execute', data:expr, state:state });
        },
        submit: function(expr, callback) {
            callbacks = callback;
            worker.postMessage({ type:'submit', data:expr });
        },
        createstate: function(callback) {
            callbacks = callback;
            worker.postMessage({ type:'freshstate' });
        },
        duplicatestate: function(state, callback) {
            callbacks = callback;
            worker.postMessage({ type:'duplicatestate', state:state });
        },
        deletestate: function(state, callback) {
            callbacks = callback;
            worker.postMessage({ type:'deletestate', state:state });
        },
        reset: function() {
            worker.postMessage({ type:'reset' });
        },
        terminate: function() {
            worker.terminate();
            clearInterrupt();
            worker = startup();
        },
    };
}

