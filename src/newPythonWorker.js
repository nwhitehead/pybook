import { spawn } from './spawn.js'
import { signalMap, sharedArray, sharedInputArray, setStarting, clearBusy, setBusy, INPUT_BUFFER_SIZE } from './signal.js';

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

            importScripts(absurl + '/lib/pyodide/pyodide.js');

            function inputGet() {
                var p = Atomics.load(sharedArray, signalMap['input_start']);
                var e = Atomics.load(sharedArray, signalMap['input_end']);
                while (e === p) {
                    // Wait for input, timeout after 100 ms
                    Atomics.wait(sharedArray, signalMap['input_end'], e, 100);
                    e = Atomics.load(sharedArray, signalMap['input_end']);
                    // Check for keyboard interrupt to avoid infinite wait for input
                    if (Atomics.load(sharedArray, signalMap['interrupt']) !== 0) {
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

            loaded = false;
            loadPyodide({indexURL : absurl + '/lib/pyodide'}).then( function() {
                let version = pyodide.runPython("import sys; sys.version");
                let pybook = {
                  sleep: function(sec) {
                    // Sleep, break immediately on interrupt
                    Atomics.wait(sharedArray, signalMap['interrupt'], 0, sec * 1000.0);
                    if (Atomics.load(sharedArray, signalMap['interrupt']) !== 0) {
                        // Clear interrupt
                        Atomics.store(sharedArray, signalMap['interrup'], 0);
                        // Throw exception (will be wrapped in JsException)
                        pyodide.runPython('raise KeyboardInterrupt');
                    }
                  },
                  output_stdout: function(data) {
                    send({ type:'stdout', data:data });
                  },
                  output_stderr: function(data) {
                    send({ type:'stderr', data:data });
                  },
                  output_text_content: function(content_type, content_data) {
                    send({ type:'output', subtype:'text', content_type:content_type, data:content_data });
                  },
                  output_binary_content: function(content_type, content_data) {
                    // Caller in Python needs to do:
                    //     import pyodide
                    //     output_binary_content('image/png', pyodide.to_js(b'...'))
                    send({ type:'output', subtype:'binary', content_type:content_type, data:content_data });
                  },
                  input_stdin: function() {
                      console.log('input_stdin called');
                      return inputGet();
                  }
                };
                pyodide.setInterruptBuffer(sharedArray);
                pyodide.registerJsModule('pybook', pybook); // synchronous
                pyodide.loadPackage('exec').then( () => {
                    pyodide.runPython('import exec');
                    // Clear starting flag
                    Atomics.store(sharedArray, signalMap['starting'], 0);
                    // Clear busy flag
                    Atomics.store(sharedArray, signalMap['busy'], 0);
                    loaded = true;
                    send({ type:'ready', data:version });
                });
            });
        },
        fn: function(input, done) {

            // Version of pyodide.runPythonAsync that goes through exec.wrapped_run_cell
            async function runCellAsync(code, messageCallback, errorCallback) {
                // Load any packages imported
                await pyodide.loadPackagesFromImports(code, messageCallback, errorCallback).catch( error => {});
                const exec_module = pyodide.globals.get('exec');
                const eval_func = exec_module.wrapped_run_cell;
                Atomics.store(sharedArray, signalMap['busy'], 1);
                eval_func(code);
                Atomics.store(sharedArray, signalMap['busy'], 0);
            };

            if (input.type === 'execute') {
                if (!loaded) {
                    done({ type:'notready' });
                } else {
                    // Now run the code
                    runCellAsync(input.data).then( (resp) => {
                        done({ type: 'response' });
                    });
                }
            } else if (input.type === 'reset') {
                if (!loaded) {
                    done({ type:'notready' });
                } else {
                    // How do you reset pyodide?
                    console.error('Cannot reset Pyodide');
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
