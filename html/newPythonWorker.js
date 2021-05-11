import { spawn } from './spawn.js'
import { signalMap, sharedArray, sharedInputArray, setStarting, INPUT_BUFFER_SIZE } from './signal.js';

export function newPythonWorker(opts) {
    if (opts === undefined) {
        opts = {}
    }
    var spawn_data = {
        setup: function() {
            absurl = config.absurl;
            signalMap = config.signalMap;
            sharedArray = config.sharedArray;
            sharedInputArray = config.sharedInputArray;
            INPUT_BUFFER_SIZE = config.INPUT_BUFFER_SIZE;

            if (typeof(Module) === "undefined") Module = {};
            if (typeof(Notebook) === "undefined") Notebook = {};

            // Load customized version of FS.createLazyFile
            // Loads into CustomFS.createLazyFile, can't directly go into FS
            // because it gets overwritten by main import. 
            importScripts(absurl + '/myCreateLazyFile.js');

            // Emscripten asm.js file needs to load data file
            // Inside Web Worker the url needs to be absolute
            Module.locateFile = function(path, prefix) {
                return absurl + '/' + path;
            };
            const files = config.opts.files;
            var filenames = [];
            if (files !== undefined) {
                for (var i = 0; i < files.length; i++) {
                    const filename = '/' + files[i];
                    filenames.push(filename);
                }
            }
            const path = filenames.join(':');
            Module["preInit"] = function() {
                const files = config.opts.files;
                if (files !== undefined) {
                    for (var i = 0; i < files.length; i++) {
                        const filename = files[i];
                        CustomFS.createLazyFile('/', filename, absurl + '/' + filename, true, false);
                    }
                }
            };
            Module['print'] = function(text) {
                if (Notebook.ready) {
                    send({ type:'stdout', data: text });
                } else {
                    // Pre-ready messages go to console
                    console.log(text);
                }
            };
            Module['printErr'] = function(text) {
                if (Notebook.ready) {
                    send({ type:'stderr', data: text });
                } else {
                    console.warn(text);
                }
            };
            importScripts(absurl + '/python.asm.js');

            var buffer = [];
            function outputPut(value) {
                if (Notebook.ready) {
                    send({ type:'stdout', data: value });
                } else {
                    // Pre-ready messages go to console
                    console.log(text);
                }
                buffer.push(value);
                if (value === 10) {
                    var msg = String.fromCharCode.apply(null, buffer);
                    Module.print(msg);
                    console.log('outputPut', value);
                    buffer = [];
                }
            }
            function inputGet() {
                var p = Atomics.load(sharedArray, signalMap['input_start']);
                var e = Atomics.load(sharedArray, signalMap['input_end']);
                while (e === p) {
                    // Wait for input, timeout after 100 ms
                    Atomics.wait(sharedArray, signalMap['input_end'], e, 100);
                    e = Atomics.load(sharedArray, signalMap['input_end']);
                    // Check for keyboard interrupt to avoid infinite wait for input
                    if (Atomics.load(sharedArray, signalMap['interrupt']) === 1) {
                        // Don't clear interrupt, let it be cleared by main eval loop
                        return null;
                    }
                }
                var value = Atomics.load(sharedInputArray, p);
                p = (p + 1) % INPUT_BUFFER_SIZE;
                Atomics.store(sharedArray, signalMap['input_start'], p);
                Atomics.notify(sharedArray, signalMap['input_start']);
                if (value === 0) {
                    // Let 0 values in input return null here
                    // This flushes buffer and lets Python process input
                    // Rule seems to be first null flushes, second null is EOF
                    value = null;
                }
                return value;
            }
            FS.init(inputGet/*, outputPut*/);

            Kernel_new = Module.cwrap('Kernel_new', 'number', ['string']);
            Kernel_delete = Module.cwrap('Kernel_delete', null, ['number']);
            Kernel_eval = Module.cwrap('Kernel_eval', null, ['number', 'string']);
            Kernel_version = Module.cwrap('Kernel_version', 'string', []);
            Kernel_reset = Module.cwrap('Kernel_reset', null, ['number']);

            // Special function called by hacked cpython ceval.c
            JS_KeyboardInterrupt = function() {
                if (Atomics.load(sharedArray, signalMap['interrupt']) === 1) {
                    Atomics.store(sharedArray, signalMap['interrupt'], 0);
                    return true;
                }
                return false;
            };

            // Custom sleep implementation called by Modules/timemodule.c
            JS_Sleep = function(x) {
                // Synchronous wait using atomics with timeout
                // This lets KeyboardInterrupt cut off sleep
                Atomics.wait(sharedArray, signalMap['interrupt'], 0, x * 1000.0);
            };

            // Methods called by pybook module
            handle_output_text_content = function(content_type, content_data) {
                send({ type:'output', subtype:'text', content_type:content_type, data:content_data });
            };
            handle_output_binary_content = function(content_type, content_data) {
                send({ type:'output', subtype:'binary', content_type:content_type, data:content_data });
            };

            // Wait for the module to be ready before calling any functions.
            var interval = setInterval(function () {
                if (Module.calledRun) {
                    clearInterval(interval);
                    kernel = Kernel_new(path);
                    Notebook.ready = true;
                    // Clear starting flag
                    Atomics.store(sharedArray, signalMap['starting'], 0);
                    var result_str = Kernel_version();
                    send({ type:'ready', data:result_str });
                }
            }, 100);
        },
        fn: function(input, done) {
            if (input.type === 'execute') {
                if (!Module.calledRun) {
                    done({ type:'notready' });
                } else {
                    Kernel_eval(kernel, input.data);
                    done({ type: 'response' });
                }
            } else if (input.type === 'reset') {
                if (!Module.calledRun) {
                    done({ type:'notready' });
                } else {
                    Kernel_reset(kernel);
                    Atomics.store(sharedArray, signalMap['starting'], 0);
                }
            } else {
                throw 'Unknown message type in webworker onmessage';
            }
        },
        config: {
            absurl: document.location.protocol + '//' + document.location.host,
            sharedArray: sharedArray,
            sharedInputArray: sharedInputArray,
            signalMap: signalMap,
            INPUT_BUFFER_SIZE: INPUT_BUFFER_SIZE,
            opts: opts
        }
    };

    var worker = spawn(spawn_data);
    // Set starting, will clear once worker is ready
    setStarting();
    return worker;
}
