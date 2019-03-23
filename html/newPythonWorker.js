import { spawn } from './spawn.js'
import { signalMap, sharedArray, setStarting, clearStarting } from './signal.js';

export function newPythonWorker() {
    var spawn_data = {
        setup: function() {
            absurl = config.absurl;
            signalMap = config.signalMap;
            sharedArray = config.sharedArray;

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
            Module["preInit"] = function() {
                //~ FS.mkdir('/lib');
                //~ FS.mkdir('/lib/python3.7');
                CustomFS.createLazyFile('/', 'localroot.zip', absurl + '/localroot.zip', true, false);
                CustomFS.createLazyFile('/', 'python3.7.zip', absurl + '/python3.7.zip', true, false);
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
            var path = '/python3.7.zip:/localroot.zip';
            importScripts(absurl + '/python.asm.js');
            Kernel_new = Module.cwrap('Kernel_new', 'number', ['string']);
            Kernel_delete = Module.cwrap('Kernel_delete', null, ['number']);
            Kernel_eval = Module.cwrap('Kernel_eval', 'number', ['number', 'string']);
            Kernel_version = Module.cwrap('Kernel_version', 'string', []);
            Kernel_reset = Module.cwrap('Kernel_reset', null, ['number']);
            Result_str = Module.cwrap('Result_str', 'number', ['number']);
            Result_delete = Module.cwrap('Result_delete', null, ['number']);

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
                    var result = Kernel_eval(kernel, input.data);
                    var result_str = Result_str(result);
                    var result_repr = UTF8ToString(result_str);
                    done({ type: 'response', data: result_repr });
                    Result_delete(result);
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
            signalMap: signalMap,
        }
    };

    var worker = spawn(spawn_data);
    // Set starting, will clear once worker is ready
    setStarting();
    return worker;
}
