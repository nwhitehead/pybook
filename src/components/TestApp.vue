//!
//! TestApp
//!
//! A Vue component representing the top level single-page test app.
//!

<template>
    <div ref="terminal"></div>
    <ConsoleInput v-model="entry" :options="options" @evaluate="clickEvaluate()" />
    <button class="button" @click="clickEvaluate()"><span>Evaluate</span></button>
</template>

<script setup>

import ConsoleInput from './ConsoleInput.vue';

import { Terminal } from 'xterm';
import { ref, onMounted } from 'vue';
import mitt from 'mitt';

const terminal = ref(null);

let entry = ref('');

const eventBus = mitt();

let options = {
    type:'python',
};

const xterm = new Terminal({
    convertEol: true,
    altClickMovesCursor: false,
    disableStdin: true,
});

onMounted(() => {
    xterm.open(terminal.value);
    // props.eventBus.emit('mounted');
    // xterm.onKey(function(event) {
    //     cli.onKey(event);
    // });
});

function clickEvaluate() {
    console.log('Evaluate button clicked', entry.value);
    entry.value = '';
}

</script>
