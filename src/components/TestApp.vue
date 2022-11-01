//!
//! TestApp
//!
//! A Vue component representing the top level single-page test app.
//!

<template>
    <div class="testappholder">
        <div class="consoleoutputholder" ref="holder">
            <ConsoleOutput :values="outputs" />
            <span class="material-icons spin" v-if="status!='Ready' && !waitingInput">autorenew</span>
            <span class="material-icons pulse" v-if="waitingInput">pending</span>
            <div class="consoleinputholder">
                <ConsoleInput v-model="entry" :options="options"
                    @evaluate="clickEvaluate()"
                    @interrupt="interrupt()"
                />
            </div>
        </div>
    </div>
    <div class="content">
        <p>Quick controls:</p>
        <ul>
            <li>Ctrl-Enter to evaluate</li>
            <li>Ctrl-C to interrupt</li>
        </ul>
    </div>
</template>

<style>
div.testappholder {
    background-color: #eee;
}
div.consoleoutputholder {
    min-height: 60px;
    max-height: 600px;
    overflow: auto;
}
div.consoleinputholder {
    margin-top: -44px;
    margin-left: 35px;
}
@keyframes spin {
    from {
        transform:rotate(0deg);
    }
    to {
        transform:rotate(360deg);
    }
}
.spin {
  animation-name: spin;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
@keyframes pulse {
	0% {
		color: #000;
	}

	50% {
		color: #888;
	}

	100% {
		color: #000;
	}
}
.pulse {
  animation-name: pulse;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
</style>

<script setup>

import ConsoleInput from './ConsoleInput.vue';
import ConsoleOutput from './ConsoleOutput.vue';

import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

import { newPythonKernel } from '../python.js';
import { signalMap,
                 isBusy,
                 isStarting, setStarting,
                 setInterrupt, clearInterrupt,
                 inputPut,
                 isInputWaiting
             } from '../signal.js';

const holder = ref(null);

let entry = ref('');
let outputs = reactive([]);
let status = ref('Initializing');

const MAX_LENGTH = 4096;

function addOutput (out) {
  if (outputs.length === 0) {
    outputs.push(out);
  } else if (outputs[outputs.length - 1].name === out.name && outputs[outputs.length - 1]['text/plain'].length < MAX_LENGTH) {
    outputs[outputs.length - 1]['text/plain'] += out['text/plain'];
  } else {
    outputs.push(out);
  }
  nextTick(() => holder.value.scroll(0, holder.value.scrollHeight));
}

// Time is used to trigger watcher on SharedArrayBuffer for waiting for stdin (Vue doesn't know when value changes there)
let timer = null;
// Vue reactive variable keeping track of whether we are waiting for stdin
let waitingInput = ref(false);
// Time interval to check for waiting on stdin
const STDIN_CHECK_INTERVAL = 100;

onMounted(() => {
    timer = setInterval(() => {
        waitingInput.value = isInputWaiting();
    }, STDIN_CHECK_INTERVAL);
});

onBeforeUnmount(() => {
    clearInterval(timer);
});

onMounted(() => {
    addOutput({
        name: 'stdout',
        'text/plain': 'Loading Python from Pyodide\n',
    });
});

const options = computed(() => {
    return {
        type: waitingInput.value ? undefined : 'python',
        ready: status.value === 'Ready',
    };
});

const normalstate = 'state';
const prompt = '>>> ';

const python_opts = {
    onReady: function (version) {
        version = 'Python ' + version;
        status.value = 'Ready';
        console.log(version);
        addOutput({
            name: 'stdout',
            'text/plain': version + '\n' + prompt,
        });
        python.freshstate(normalstate, {
            onResponse: function() {
            },
        });
    },
};

const python = newPythonKernel(python_opts);

//! Take a multiline string and indent it with a prefix on first line, different prefix on subsequent lines
function fancy_indent(txt, first_prefix, prefix) {
    const lines = txt.split('\n');
    let result = [];
    let current_prefix = first_prefix;
    for (let i = 0; i < lines.length; i++) {
        result.push(current_prefix + lines[i]);
        current_prefix = prefix;
    }
    return result.join('\n');
}

function clickEvaluate() {
    const src = entry.value;
    entry.value = '';
    if (isInputWaiting()) {
        // Convert string from CodeMirror into byte array
        // Use UTF-8 since CodeMirror might have advanced unicode characters
        const utf8Encoder = new TextEncoder();
        const bytes = utf8Encoder.encode(src);
        // Send bytes one by one using inputPut
        // Receiver will handle flipping isInputWaiting flag as appropriate
        for (let i = 0; i < bytes.length; i++) {
            inputPut(bytes[i]);
        }
        // Empty input needs to be distinguished from EOF (like pressing Ctrl-D)
        if (bytes.length === 0) {
            inputPut(10);
        }
        inputPut(0);
        return;
    }
    if (status.value === 'Initializing' || status.value === 'Working') {
        entry.value = src;
        return;
    }
    clearInterrupt();
    status.value = 'Working';
    addOutput({
        name: 'stdout',
        'text/plain': fancy_indent(src, '', '... ') + '\n',
    });
    python.evaluate(src, normalstate, {
        onStdout: function (msg) {
            addOutput({
                name: 'stdout',
                'text/plain': msg,
            });
        },
        onStderr: function (msg) {
            addOutput({
                name: 'stderr',
                'text/plain': msg,
            });
        },
        onOutput: function(content_type, msg) {
            let item = {};
            item[content_type] = msg;
            addOutput(item);
        },
        onResponse: function () {
            addOutput({
                name: 'stdout',
                'text/plain': prompt,
            });
            status.value = 'Ready';
        }
    });
}

function interrupt() {
    status.value = 'Interrupt';
    setInterrupt();
}

</script>
