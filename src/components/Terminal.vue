<template>
    <div ref="terminal"></div>
</template>

<script setup>

import { reactive, ref, watch, onMounted } from "vue";
import { Terminal } from 'xterm';
import { Prompt } from '../prompt.js';

const terminal = ref(null);

const props = defineProps([ 'eventBus' ]);

const xterm = new Terminal({
    convertEol: true
});

let cli = Prompt();

let currentEntry = '';

onMounted(() => {
    xterm.open(terminal.value);
    props.eventBus.emit('mounted');
    xterm.onKey(function(event) {
        const keyCode = event.domEvent.keyCode;
        if (keyCode === 13) {
            if (props.eventBus.acceptingInput) {
                xterm.write('\r\n');
                props.eventBus.emit('input', currentEntry);
                currentEntry = '';
                props.eventBus.acceptingInput = false;
            }
        } else if (keyCode === 8) {
            if (currentEntry && currentEntry !== '') {
                currentEntry = currentEntry.slice(0, currentEntry.length - 1);
                xterm.write('\b \b');
            }
        } else if (event.domEvent.key && event.domEvent.key.length === 1) {
            currentEntry += event.key;
            xterm.write(event.key);
        }
    });
});

props.eventBus.on('stdout', msg => {
    xterm.write(msg);
});

props.eventBus.on('stderr', msg => {
    xterm.write(msg);
});

</script>
