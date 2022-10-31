//!
//! Terminal
//!
//! A Vue component representing a text terminal. The terminal keeps track of it's own state. To communicate with the
//! terminal you set up an event bus and set it to the property 'eventBus'.
//!

<template>
    <div ref="terminal"></div>
</template>

<script setup>

import { reactive, ref, watch, onMounted } from 'vue';
import { Terminal } from 'xterm';
import { Prompt } from '../prompt.js';

const terminal = ref(null);

const props = defineProps([ 'eventBus' ]);

const xterm = new Terminal({
    convertEol: true
});

let cli = Prompt({
    handleInput: (input) => {
        props.eventBus.emit('input', input);
    },
    xterm
});

onMounted(() => {
    xterm.open(terminal.value);
    props.eventBus.emit('mounted');
    xterm.onKey(function(event) {
        cli.onKey(event);
    });
});

props.eventBus.on('stdout', msg => {
    xterm.write(msg);
});

props.eventBus.on('stderr', msg => {
    xterm.write(msg);
});

props.eventBus.on('prompt', msg => {
    cli.showPrompt(msg);
});

</script>
