//!
//! Example
//!
//! A Vue component representing an example. Syntax highlighting, click to send to editor.
//!
//! Note: uses global eventbus for communication to MultiApp/ConsoleApp/CodeApp
//!
//! Props:
//! - code - String of code for the example
//! - disabled - True if the example should not be playable (default is playable)
//!

<template>
    <div class="wrapper">
        <pre><code class="language-python">{{ code }}</code></pre>
        <div class="controls">
            <button v-if="!disabled" class="button is-small" data-tooltip="Copy to clipboard" @click="copyToClipboard">
                <span class="material-icons">content_copy</span>
            </button>
            <button v-if="!disabled" class="button is-small" data-tooltip="Send to editor" @click="sendToEditor">
                <span class="material-icons">edit</span>
            </button>
            <button v-if="!disabled" class="button is-small" data-tooltip="Send to console" @click="sendToConsole">
                <span class="icon-terminal" />
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
    background-color: transparent; /* var(--toolbar-bg); */
    width: 3.0em;
}
.wrapper .controls .button span {
    transform: scale(0.75);
}
.wrapper .button img {
    min-width: 18px;
}
</style>

<script setup>

import { onUpdated, ref } from 'vue';
import Prism from 'prismjs';

import { eventbus } from './globals.js';
import _ from '../icomoon.css';

const props = defineProps([ 'code', 'disabled' ]);

onUpdated(() => {
    Prism.highlightAll();
});

// Time to clear "Copied!" message after clicking
const TOOLTIP_COPIED_CLEAR_DELAY = 2000;

async function copyToClipboard(evt) {
    try {
        const target = evt.currentTarget;
        const oldText = target.getAttribute('data-tooltip');
        target.setAttribute('data-tooltip', 'Copied!');
        await navigator.clipboard.writeText(props.code);
        // Clear data-tooltip update and blur to remove message after timeout
        setTimeout(() => {
            target.setAttribute('data-tooltip', oldText);
            target.blur();
        }, TOOLTIP_COPIED_CLEAR_DELAY);
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
