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
        <div v-if="!disabled" class="control" @click="sendToConsole">
            <span class="material-icons large">play_circle</span>
        </div>
        <pre><code class="language-python">{{ code }}</code></pre>
    </div>
</template>

<style>
.wrapper {
    position: relative;
}
.wrapper pre {
    display: block;
}
.wrapper div.control {
    position: absolute;
    top: 50%;
    right: 0;
    padding-top: 5px;
    transform: translateY(-50%) scale(3.0);
    color: var(--primary);
    cursor: pointer;
}
[data-theme=""] .wrapper div.control {
    text-shadow: var(--grey) -3px 2px 6px;
}
.wrapper div.control:hover {
    color: var(--primaryhover);
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

function sendToEditor(evt) {
    eventbus.emit('editor:example', { code:props.code });
}

function sendToConsole(evt) {
    eventbus.emit('console:example', { code:props.code });
}

</script>
