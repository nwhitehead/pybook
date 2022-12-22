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
    <div ref="element">
        <template v-for="cell in cells">
            <Example v-if="cell.cell_type === 'python'" :code="cell.source" />
            <template v-if="cell.cell_type === 'markdown'">
                <div class="content" v-html="markdownContent(cell.source)" />
            </template>
        </template>
    </div>
</template>

<script setup>

import { computed, onMounted, onUpdated, ref } from 'vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

import Example from './Example.vue';
import { parse } from '../parser.js';

const props = defineProps([ 'fileContents' ]);

const cells = computed(() => {
    // Just return first page
    return parse(props.fileContents)[0];
});

const element = ref(null);

function typesetMath() {
    MathJax.typesetClear([element.value]);
    MathJax.typesetPromise([element.value]);
}

onMounted(() => {
    typesetMath();
});

onUpdated(() => {
    typesetMath();
});

function markdownContent(src) {
    return DOMPurify.sanitize(marked(src));
}
</script>
