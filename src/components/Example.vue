//!
//! Example
//!
//! A Vue component representing an example. Syntax highlighting, click to send to editor.
//!
//! Props:
//! - code - String of code for the example
//! - disabled - True if the example should not be playable (default is playable)
//!

<template>
    <div class="wrapper">
        <pre><code class="language-python">{{ code }}</code></pre>
        <div class="controls">
            <button v-if="!disabled" class="button is-small" title="Copy to clipboard" @click="copyToClipboard">
                <span class="material-icons">content_copy</span>
            </button>
            <button v-if="!disabled" class="button is-small" title="Send to editor" @click="sendToEditor">
                <span class="material-icons">edit</span>
            </button>
            <button v-if="!disabled" class="button is-small" title="Send to console" @click="sendToConsole">
                <span class="material-icons">computer</span>
            </button>
        </div>
    </div>
</template>

<style>
.wrapper {
    position: relative;
}
.wrapper pre {
    display: block;
}

.wrapper .controls {
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px 5px 5px 1.5em;
    color: var(--dark);
    cursor: pointer;
    user-select: none;
    display: flex;
}
.wrapper .controls .button {
    color: var(--toolbar-fg);
    background-color: var(--toolbar-bg);
}
.wrapper .controls .button span {
    transform: scale(0.75);
}
</style>

<script setup>

import { onMounted, ref } from 'vue';
import Prism from 'prismjs';

import { eventbus } from './globals.js';

const props = defineProps([ 'code', 'disabled' ]);

onMounted(() => {
    Prism.highlightAll();
});

async function copyToClipboard(evt) {
    try {
        await navigator.clipboard.writeText(props.code);
    } catch(e) {
        console.log('Error: could not copy text to clipboard');
    }
}

function sendToEditor(evt) {
    eventbus.emit('editor:example', { code:props.code });
}

function sendToConsole(evt) {
    eventbus.emit('console:example', { code:props.code });
}

</script>
