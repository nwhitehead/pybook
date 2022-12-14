//!
//! ExampleFromFile
//!
//! A Vue component representing an example, taken from a file.
//!
//! File format is custom, based on ideas from https://github.com/mrzv/saturn
//! Lines starting with "#m> " are for Markdown.
//! No prefix lines are Python.
//! Multiple Python examples are split with "#---#"
//!
//! Props:
//! - fileContents - Contents of the file which become sequence of Markdown and Examples
//!

<template>

    <pre><code>{{props.fileContents}}</code></pre>

</template>

<script setup>

import { onMounted } from 'vue';

import Example from './Example.vue';

const props = defineProps([ 'fileContents' ]);

onMounted(() => {
//    Prism.highlightAll();
});

</script>
