import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt
       } from './signal.js';

import { newPythonWorker } from './newPythonWorker.js';

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
            console.log('CPython-Emscripten Ready - ' + msg);
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
    // No defaults:
    // opts.onFilesystem

    const workerOpts = {
        files: [
            'python3.8.zip',
            'localroot.zip'
        ].concat(opts.files)
    };
    const worker = newPythonWorker(workerOpts);
    var callbacks = [];
    worker.on('message', function(msg) {
        const defaultHandler = function() { console.log('default handler'); };
        const callback = callbacks[0];
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
            if (callbacks.length > 0) {
                callbacks.shift();
                findHandler('onResponse', callback, opts, defaultHandler)(msg.content_type, msg.data);
            } else {
                throw 'Unexpected response from kernel'
            }
            //
        } else {
            console.log('Unknown message type in main thread onmessage', msg);
            throw 'Unknown message type in main thread onmessage';
        }
    });
    
    return {
        callbacks: [],
        evaluate: function(expr, callback) {
            callbacks.push(callback);
            worker.send({ type:'execute', data:expr });
        },
        reset: function() {
            worker.send({ type:'reset' });
        },
        terminate: function() {
            worker.terminate();
        },
    };
}

