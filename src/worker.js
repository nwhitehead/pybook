// The worker

import { loadPyodide } from '/static/lib/pyodide/pyodide.mjs';

// First message will be config object to setup shared arrays and other configuration

let absurl = null;
let signalMap = null;
let sharedArray = null;
let sharedInputArray = null;
let INPUT_BUFFER_SIZE = null;
let loaded = null;
let states = null;

// Interval to synchronize local filesystem changes to IndexDB
const PERSISTENT_INTERVAL_MS = 5000;

async function configure(config) {
    // This code runs after we get the configuration data
    absurl = config.absurl;
    signalMap = config.signalMap;
    sharedArray = config.sharedArray;
    sharedInputArray = config.sharedInputArray;
    INPUT_BUFFER_SIZE = config.INPUT_BUFFER_SIZE;

    function inputGet() {
        // Signal that we are waiting for input
        Atomics.store(sharedArray, signalMap['input_waiting'], 1);
        Atomics.notify(sharedArray, signalMap['input_waiting']);

        var p = Atomics.load(sharedArray, signalMap['input_start']);
        var e = Atomics.load(sharedArray, signalMap['input_end']);
        while (e === p) {
            // Wait for input, timeout after 100 ms
            Atomics.wait(sharedArray, signalMap['input_end'], e, 100);
            e = Atomics.load(sharedArray, signalMap['input_end']);
            // Check for keyboard interrupt to avoid infinite wait for input
            if (Atomics.load(sharedArray, signalMap['interrupt']) !== 0) {
                Atomics.store(sharedArray, signalMap['input_waiting'], 0);
                pyodide.checkInterrupt();
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
        // Clear waiting flag
        Atomics.store(sharedArray, signalMap['input_waiting'], 0);
        return value;
    }

    loaded = false;
    let pyodide = await loadPyodide({indexURL : absurl + '/static/lib/pyodide'});
    let version = '🐍 Python ' + pyodide.runPython('import sys; sys.version') + '\n🤖 Pyodide ' + pyodide.version;

    function wait_io_complete() {
        // Wait until io is complete to continue (worker is synchronous IO)
        while (Atomics.load(sharedArray, signalMap['io_complete']) === 0) {
            Atomics.wait(sharedArray, signalMap['io_complete'], 0, 100.0);
        }
        // IO is now complete, reset signal back to 0 for next time
        Atomics.store(sharedArray, signalMap['io_complete'], 0);
    }

    let pybook = {
        sleep: function(sec) {
            // Sleep, break immediately on interrupt
            Atomics.wait(sharedArray, signalMap['interrupt'], 0, sec * 1000.0);
            if (Atomics.load(sharedArray, signalMap['interrupt']) !== 0) {
                pyodide.checkInterrupt();
            }
        },
        output_stdout: function(data) {
            pyodide.checkInterrupt();
            postMessage({ type:'stdout', data:data });
            wait_io_complete();
        },
        output_stderr: function(data) {
            pyodide.checkInterrupt();
            postMessage({ type:'stderr', data:data });
            wait_io_complete();
        },
        output_content: function(content_type, content_data) {
            pyodide.checkInterrupt();
            if (typeof(content_data) === 'string') {
                postMessage({ type:'output', subtype:'text', content_type:content_type, data:content_data });
                wait_io_complete();
            } else {
                postMessage({ type:'output', subtype:'binary', content_type:content_type, data:content_data.toJs() });
                wait_io_complete();
            }
        },
        output_file: function(content_type, filename) {
            pyodide.checkInterrupt();
            const content_data = pyodide.FS.readFile(filename);
            postMessage({ type:'output', subtype:'binary', content_type:content_type, data:content_data });
            wait_io_complete();
        },
        input_stdin: function() {
            return inputGet();
        },
        download_file: function(content_type, filename) {
            pyodide.checkInterrupt();
            const content_data = pyodide.FS.readFile(filename);
            postMessage({ type:'download', content_type:content_type, data:content_data, filename:filename });
            wait_io_complete();
        },
    };
    // Setup local filesystem (persistent storage local to browser)
    pyodide.FS.mkdir('persistent');
    pyodide.FS.mount(pyodide.FS.filesystems.IDBFS, {}, 'persistent');
    // Initial sync from existing index into FS state ('true' direction)
    pyodide.FS.syncfs(true, () => {});
    globalThis.pyodide = pyodide;
    // Persistent filesystem every so often
    setInterval(() => {
        // Send changes to IndexDB ('false' direction)
        pyodide.FS.syncfs(false, () => {});
    }, PERSISTENT_INTERVAL_MS);
    // Set interrupt buffer
    pyodide.setInterruptBuffer(sharedArray);
    // Register pybook model (JavaScript code, not a real module)
    pyodide.registerJsModule('pybook', pybook); // synchronous
    // Get micropip to be able to load local pbexec pure python package
    await pyodide.loadPackage('micropip');
    pyodide.runPython('import micropip');
    // Install pbexec
    await pyodide.runPythonAsync('await micropip.install("' + absurl + '/static/lib/pyodide/pbexec_nwhitehead-0.0.1-py3-none-any.whl' + '")');
    pyodide.runPython('from pbexec import pbexec');
    pyodide.runPython('import sys; sys.setrecursionlimit(150)');
    // Start with fresh state as base
    states = {
        base:pyodide.globals.get('pbexec').fresh_state()
    };
    // Clear starting flag
    Atomics.store(sharedArray, signalMap['starting'], 0);
    // Clear busy flag
    Atomics.store(sharedArray, signalMap['busy'], 0);
    loaded = true;
    postMessage({ type:'ready', data:version });

    function getState(name) {
        if (name === undefined || name === null) {
            name = 'base';
        }
        return states[name];
    }

    // Synchronous generation of blank fresh state
    // Returns index into states variable (actual state cannot be communicated across message channel)
    function freshState(name) {
        states[name] = pyodide.globals.get('pbexec').fresh_state();
    }

    // Duplicate a state
    function duplicateState(oldName, newName) {
        let oldState = states[oldName];
        let newState = pyodide.globals.get('pbexec').duplicate_state(oldState);
        states[newName] = newState;
    }

    // Delete a state
    function deleteState(name) {
        delete states[name];
    }

    // Version of pyodide.runPythonAsync that goes through exec.wrapped_run_cell
    async function runCellAsync(code, state, options) {
        Atomics.store(sharedArray, signalMap['busy'], 1);
        const exec_module = pyodide.globals.get('pbexec');
        let theState = getState(state);
        if (options.usePyPI) {
            const imports = pyodide.pyodide_py.code.find_imports(code).toJs();
            let packages = []; // what cannot be imported, to install with micropip
            // micropip covers pyodide native packages and PyPI
            for (let i = 0; i < imports.length; i++) {
                const elem = imports[i];
                try {
                    pyodide.pyimport(elem);
                } catch(err) {
                    // If 'import ...' did not work, schedule the package to be loaded with micropip
                    packages.push(elem);
                }
            }
            // Use handy function pyodide provides to map import name to package name (e.g. 'import bs4' becomes package 'beautifulsoup4')
            const import_name_to_package_name = pyodide._api._import_name_to_package_name;
            for (let i = 0; i < packages.length; i++) {
                const name = packages[i];
                let packagename = import_name_to_package_name[name] ? import_name_to_package_name[name] : name;
                try {
                    await pyodide.runPythonAsync('await micropip.install("' + packagename + '")');
                } catch(err) {
                    // Catch the Python exception here and ignore besides a log message
                    // When evaluating the user source, the import will fail giving correct exception at correct location to user
                    console.log(`Error loading package ${packagename}`);
                }
            }
        } else {
            // Don't use PyPI, just load any local Pyodide packages
            await pyodide.loadPackagesFromImports(code);
        }
        const eval_func = exec_module.wrapped_run_cell;
        const default_func = options.no_default_func ? null : exec_module.default_func;
        await eval_func(code, /*globals_=*/theState, /*locals_=*/null, /*func=*/default_func, /*history=*/true, /*write=*/true, /*print_exception=*/true, /*propagate_exception=*/false, /*strip=*/1);
        Atomics.store(sharedArray, signalMap['busy'], 0);
    };

    // Set an indentifier in a given state to a value
    function setGlobal(name, identifier, value) {
        let theState = getState(name);
        theState.set(identifier, value);
    }

    // Switch our message response to update from waiting for config to responding to inputs
    onmessage = async function(e) {
        let input = e.data;
        if (input.type === 'execute' || input.type === 'setglobal' || input.type === 'freshstate' || input.type === 'duplicatestate' || input.type === 'deletestate') {
            if (!loaded) {
                postMessage({ type:'notready' });
            } else {
                if (input.type === 'execute') {
                    // Now run the code (only send response once code finishes)
                    await runCellAsync(input.expr, input.name, input.options);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'setglobal') {
                    // Set a global variable
                    setGlobal(input.name, input.identifier, input.value);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'freshstate') {
                    freshState(input.name);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'duplicatestate') {
                    duplicateState(input.oldName, input.newName);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'deletestate') {
                    deleteState(input.name);
                    postMessage({ type: 'response' });
                }
            }
        } else {
            throw 'Unknown message type in webworker onmessage';
        }
    };
}

// Initial state is to wait for configuration object
onmessage = function(e) {
    configure(e.data);
}
