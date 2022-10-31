//!
//! TestApp
//!
//! A Vue component representing the top level single-page test app.
//!

<template>
    <div class="testappholder">
        <div class="consoleoutputholder" ref="holder">
            <ConsoleOutput :values="outputs" />
        </div>
        <div class="consoleinputholder">
            <ConsoleInput v-model="entry" :options="options"
                @evaluate="clickEvaluate()"
                @interrupt="interrupt()"
            />
        </div>
        <button class="button" @click="clickEvaluate()"><span>Evaluate</span></button>
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
</style>

<script setup>

import ConsoleInput from './ConsoleInput.vue';
import ConsoleOutput from './ConsoleOutput.vue';

import { computed, reactive, ref, onMounted, nextTick } from 'vue';

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

onMounted(() => {
    addOutput({
        name: 'stdout',
        'text/plain': 'Loading Python from Pyodide\n',
    });
});

const options = computed(() => {
    return {
        type:'python',
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
            if (status.value === 'Working') {
                status.value = 'Ready';
            }
        }
    });
}

function interrupt() {
    status.value = 'Interrupt';
    setInterrupt();
}

</script>
