// The worker

// First message will be config object to setup shared arrays and other configuration

async function configure(config) {
    // This code runs after we get the configuration data
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
                // Clear interrupt
                Atomics.store(sharedArray, signalMap['interrupt'], 0);
                // Throw exception (will be wrapped in JsException)
                pyodide.runPython('raise KeyboardInterrupt');
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
    let pyodide = await loadPyodide({indexURL : absurl + '/lib/pyodide'});
    let version = pyodide.runPython("import sys; sys.version");
    let pybook = {
        sleep: function(sec) {
            // Sleep, break immediately on interrupt
            Atomics.wait(sharedArray, signalMap['interrupt'], 0, sec * 1000.0);
            if (Atomics.load(sharedArray, signalMap['interrupt']) !== 0) {
                // Clear interrupt
                Atomics.store(sharedArray, signalMap['interrupt'], 0);
                // Throw exception (will be wrapped in JsException)
                pyodide.runPython('raise KeyboardInterrupt');
            }
        },
        output_stdout: function(data) {
            postMessage({ type:'stdout', data:data });
        },
        output_stderr: function(data) {
            postMessage({ type:'stderr', data:data });
        },
        output_text_content: function(content_type, content_data) {
            postMessage({ type:'output', subtype:'text', content_type:content_type, data:content_data });
        },
        output_binary_content: function(content_type, content_data) {
            // Caller in Python needs to do:
            //     import pyodide
            //     output_binary_content('image/png', pyodide.to_js(b'...'))
            postMessage({ type:'output', subtype:'binary', content_type:content_type, data:content_data });
        },
        input_stdin: function() {
            return inputGet();
        }
    };
    pyodide.setInterruptBuffer(sharedArray);
    pyodide.registerJsModule('pybook', pybook); // synchronous
    pyodide.loadPackage('pbexec').then( () => {
        pyodide.runPython('import sys; sys.setrecursionlimit(120)');
        pyodide.runPython('import pbexec');
        pyodide.runPython('pbexec.register_pickle()');
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
    });

    // Load package by loading dependencies first serially
    async function loadDependenciesFirst (pkg) {
        if (Array.isArray(pkg)) {
            for (let pkgi of pkg) {
                await loadDependenciesFirst(pkgi);
            }
            return;
        }
        // We manually loaded pybook in JavaScript, it is not a package
        if (pkg === 'pybook') {
            return;
        }
        const deps = Module.packages.dependencies[pkg];
        for (let deppkg of deps) {
            await loadDependenciesFirst(deppkg);
        }
        await pyodide.loadPackage(pkg);
    }

    // This function duplicates pyodide.loadPackagesFromImports
    // pyodide.loadPackagesFromImports did not work at all
    // Had deadlock on packages with dependency chains
    async function loadPackagesFromImports (code) {
        try {
            let imports = pyodide.pyodide_py.find_imports(code).toJs();
            await loadDependenciesFirst(imports);
        } catch (e) {
        }
    }

    function getState(state) {
        if (state === undefined) {
            state = 'base';
        }
        return states[state];
    }
    let globalId = 0;
    function freshName() {
        const name = 'state' + globalId;
        globalId++;
        return name;
    }
    // Synchronous generation of blank fresh state
    // Returns index into states variable (actual state cannot be communicated across message channel)
    function freshState() {
        const name = freshName();
        states[name] = pyodide.globals.get('pbexec').fresh_state();
        return name;
    }

    // Duplicate a state
    function duplicateState(state) {
        let oldState = getState(state);
        let newState = pyodide.globals.get('pbexec').duplicate_state(oldState);
        const name = freshName();
        states[name] = newState;
        return name;
    }

    // Delete a state
    function deleteState(state) {
        delete states[state];
    }

    // Version of pyodide.runPythonAsync that goes through exec.wrapped_run_cell
    async function runCellAsync(code, state) {
        const exec_module = pyodide.globals.get('pbexec');
        state = getState(state);
        await loadPackagesFromImports(code);
        const eval_func = exec_module.wrapped_run_cell;
        Atomics.store(sharedArray, signalMap['busy'], 1);
        eval_func(code, globals_=state);
        Atomics.store(sharedArray, signalMap['busy'], 0);
    };

    async function submitCellAsync(code) {
        const submit_func = pyodide.globals.submit;
        console.log('submit_func is ', submit_func);
        Atomics.store(sharedArray, signalMap['busy'], 1);
        submit_func(code); // let the submit function decide whether to use pbexec or not (needed to get real output)
        Atomics.store(sharedArray, signalMap['busy'], 0);
    };

    // Switch our message response to update from waiting for config to responding to inputs
    onmessage = async function(e) {
        let input = e.data;
        if (input.type === 'execute' || input.type === 'submit' || input.type === 'freshstate' || input.type === 'duplicatestate' || input.type === 'deletestate') {
            if (!loaded) {
                postMessage({ type:'notready' });
            } else {
                if (input.type === 'execute') {
                    // Now run the code (only send response once code finishes)
                    await runCellAsync(input.data, input.state);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'submit') {
                    submitCellAsync(input.data);
                    postMessage({ type: 'response' });
                }
                if (input.type === 'freshstate') {
                    const state = freshState();
                    postMessage({ type: 'response', state: state});
                }
                if (input.type === 'duplicatestate') {
                    const state = duplicateState(input.state);
                    postMessage({ type: 'response', state: state });
                }
                if (input.type === 'deletestate') {
                    deleteState(input.state);
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
