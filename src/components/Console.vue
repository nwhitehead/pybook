//!
//! Console
//!
//! A Vue component representing a Python console. You can input text and evaluate it in sequence in a console, seeing results each time.
//! A console is different than a notebook in that you only have one state, you are always interacting with current state, cannot edit
//! cells or evaluate cells in arbitrary order. Input does have history, so you can evaluate old inputs again.
//!
//! A Console is a terminal plus input controls for entering text to evaluate.
//!
//! Props:
//! - eventBus - This is the event bus (mit) that is used to communicate with the console
//!
//! Event bus events generated:
//! - mounted - Component is mounted and ready for more events
//! - input - User has entered an input for evaluation
//!
//! Event bus events consumed:
//! - stdout - Provide text for stdout
//! - stderr - Provide text for stderr
//! - prompt - Show a prompt for input

<template>
    <div ref="terminal"></div>
</template>


<script setup>

import { reactive, ref, watch, onMounted } from 'vue';
import { Terminal } from 'xterm';
import mitt from 'mitt';

const props = defineProps([ 'eventBus' ]);

const xterm = new Terminal({
    convertEol: true
});

onMounted(() => {
    xterm.open(terminal.value);
    props.eventBus.emit('mounted');
    xterm.onKey(function(event) {
    });
});

</script>
