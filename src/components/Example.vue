//!
//! Example
//!
//! A Vue component representing an example. Syntax highlighting, click to send to editor.
//!

<template>
<pre @click="sendToEditor"><code class="language-python">{{ code }}</code></pre>
</template>

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
