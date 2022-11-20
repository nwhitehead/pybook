//!
//! Example
//!
//! A Vue component representing an example. Syntax highlighting, click to send to editor.
//!

<template>
    <div class="wrapper">
        <div class="control" @click="sendToEditor">
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

const props = defineProps([ 'code' ]);

onMounted(() => {
    Prism.highlightAll();
});

function sendToEditor(evt) {
    eventbus.emit('example', { code:props.code });
}

</script>
