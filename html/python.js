import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt
       } from './signal.js';

import { newPythonWorker } from './newPythonWorker.js';

var callbacks = [];

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
        opts.onResponse = function(msg) {
            console.log(msg);
        };
    }
    // No defaults:
    // opts.onFilesystem

    const worker = newPythonWorker();
    worker.on('message', function(msg) {
        if (msg.type === 'ready') {
            if (opts.onReady) {
                opts.onReady(msg.data);
            }
        } else if (msg.type === 'stdout') {
            if (opts.onStdout) {
                opts.onStdout(msg.data);
            }
        } else if (msg.type === 'stderr') {
            if (opts.onStderr) {
                opts.onStderr(msg.data);
            }
        } else if (msg.type === 'output') {
            if (opts.onOutput) {
                opts.onOutput(msg.content_type, msg.data);
            }
        } else if (msg.type === 'filesystem') {
            if (opts.onFilesystem) {
                opts.onFilesystem();
            }
        } else if (msg.type === 'response') {
            if (callbacks.length > 0) {
                const callback = callbacks.pop();
                if (callback) {
                    callback(msg.data);
                } else {
                    if (opts.onResponse) {
                        opts.onResponse(msg.data);
                    } else {
                        throw 'Unhandled response'
                    }
                }
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

