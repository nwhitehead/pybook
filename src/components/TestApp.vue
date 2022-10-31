//!
//! TestApp
//!
//! A Vue component representing the top level single-page test app.
//!

<template>
    <div ref="terminal"></div>
    <p>{{ status }}</p>
    <ConsoleInput v-model="entry" :options="options" @evaluate="clickEvaluate()" />
    <button class="button" @click="clickEvaluate()"><span>Evaluate</span></button>
</template>

<script setup>

import ConsoleInput from './ConsoleInput.vue';

import { Terminal } from 'xterm';
import { ref, onMounted } from 'vue';
import mitt from 'mitt';

import { newPythonKernel } from '../python.js';
import { signalMap,
                 isBusy,
                 isStarting, setStarting,
                 setInterrupt, clearInterrupt,
                 inputPut
             } from '../signal.js';

const terminal = ref(null);

let entry = ref('');
let status = ref('Initializing');

const eventBus = mitt();

let options = {
    type:'python',
};

const xterm = new Terminal({
    convertEol: true,
    altClickMovesCursor: false,
    disableStdin: true,
});

const normalstate = 'state';

const python_opts = {
    onReady: function (version) {
        status.value = 'Ready';
        console.log(version);
        xterm.write(version + '\n');
        python.freshstate(normalstate, {
            onResponse: function() {
            },
        });
    },
};

const python = newPythonKernel(python_opts);

onMounted(() => {
    xterm.open(terminal.value);
});

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
    console.log('Evaluate button clicked', entry.value);
    const src = entry.value;
    entry.value = '';
    if (status.value === 'Initializing' || status.value === 'Working') {
        console.log('Python is not ready yet');
        entry.value = src;
        return;
    }
    clearInterrupt();
    status.value = 'Working';
    xterm.write(fancy_indent(src, '>>> ', '... ') + '\n');
    python.evaluate(src, normalstate, {
        onStdout: function (msg) {
            xterm.write(msg);
        },
        onStderr: function (msg) {
            xterm.write(msg);
        },
        onOutput: function(content_type, msg) {
            xterm.write('<output type not supported>\n');
        },
        onResponse: function () {
            // Check that status was previously working in case there was an interrupt
            if (status.value === 'Working') {
                status.value = 'Ready';
            }
        }
    });
}

</script>
