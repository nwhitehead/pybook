//!
//! CellOutput
//!
//! A Vue component representing cell output. Output may consist of text or other MIME types.
//!
//! This component is responsible for handling blocking stdin input from Python. Input is always
//! done at the end of all output with a button and CellInput area to edit text. Only shown when
//! python is blocking on stdin input.
//!
//! Props:
//! - values - An array of outputs. Each element in the array has type suitable for DataOutput.
//!

<template>
    <div class="celloutput">
        <template v-for="value in values">
            <DataOutput v-bind:value="value" />
        </template>
        <div v-if="showInputButton">
            <CellInput v-model="textInput" :options="{ singleLine: true }" />
            <button @click="handleInputClick">Input</button>
        </div>
    </div>
</template>

<style>
.celloutput {
    height: auto;
}
</style>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue';
import CellInput from './CellInput.vue';
import DataOutput from './DataOutput.vue';
import { isInputWaiting, inputPut } from '../signal.js';

defineProps(['values']);

let timer = null;
let textInput = ref('');
let showInputButton = ref(false);

onMounted(() => {
    timer = setInterval(() => {
        showInputButton.value = isInputWaiting();
    }, 500);
});

onBeforeUnmount(() => {
    clearInterval(timer);
});

function handleInputClick() {
    // Convert string from CodeMirror into byte array
    const utf8Encoder = new TextEncoder();
    const bytes = utf8Encoder.encode(textInput.value);
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
}

</script>
