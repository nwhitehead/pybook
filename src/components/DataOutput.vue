//!
//! DataOutput
//!
//! A Vue component representing the content of data output cells. Types include:
//! * Python text output
//! * HTML content
//! * SVG content
//!
//! Props:
//! * value - This is a dict with keys of MIME type and value of content. MIME types are:
//!     - text/plain
//!     - text/html
//!     - image/svg+xml
//!   Additionally value may have key "name" with value of "stdout" or "stderr" to distinguish different "text/plain" MIME outputs.
//!
//! If the value has more than one MIME type, they will be shown sequentially with simplest first.
//!
//! Note that text/html type is passed through an HTML sanitizer to prevent various types of attacks.
//! For stdout/stderr output, the text is first HTML escaped to allow things like REDACTED to work.
//! (The string I want to put there breaks the Vue esbuild compile...)
//! Next the escaped HTML is put through an ANSI convert function to allow ANSI escape codes for colors etc.
//! Finally there is an HTML sanitizer to prevent unintentional final results with dangerous consequences.
//!

<template>
    <div class="dataoutput">
        <pre
            v-if="isPre(value)"
            :class="getClass(value)"
            v-html="preContent"
        />
        <div v-if="isHtml(value)" :class="getClass(value)">
            <div class="content" v-html="htmlMarkdown" ref="htmlContent" />
        </div>
        <img v-if="isSVG(value)" :src="dataURI(value['image/svg+xml'])" />
    </div>
</template>

<style>
div.dataoutput pre.stdout {
    background-color: transparent;
}
div.dataoutput pre.stderr {
    background-color: #ff0;
}
.dataoutput pre {
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    padding: 1px 15px 1px 15px;
}
.dataoutput div.html {
    margin: 0;
    padding: 1px 15px 1px 15px;
}
</style>

<script setup>

import { computed, ref, onMounted, onUpdated } from 'vue';
import DOMPurify from 'dompurify';
import Convert from 'ansi-to-html';

const convert = new Convert();
const htmlContent = ref(null);
const props = defineProps(['value']);
const htmlMarkdown = computed(() => {
    return DOMPurify.sanitize(props.value['text/html']);
});
const preContent = computed(() => {
    return DOMPurify.sanitize(convert.toHtml(escapeHtml(props.value['text/plain'])));
});

function escapeHtml (unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function typesetMath() {
    MathJax.typesetClear([htmlContent.value]);
    MathJax.typesetPromise([htmlContent.value]);
}

onMounted(() => {
    if (isHtml(props.value)) {
        typesetMath();
    }
});

onUpdated(() => {
    if (isHtml(props.value)) {
        typesetMath();
    }
});

function getClass (value) {
    if (isPre(value)) {
        if (value.name === 'stderr') {
            return 'stderr';
        }
        // Default to stdout if there is no name
        return 'stdout';
    }
    if (isHtml(value)) return 'html';
    if (isSVG(value)) return 'svg';
    return 'stdout';
}

function isPre (value) {
    if (value === undefined) return false;
    return value['text/plain'] !== undefined;
}

function isHtml (value) {
    if (value === undefined) return false;
    return value['text/html'] !== undefined;
}

function isSVG (value) {
    if (value === undefined) return false;
    return value['image/svg+xml'] !== undefined;
}

function dataURI (value) {
    // btoa is a builtin web API function converting bytes to base64 encoded values
    return 'data:image/svg+xml;base64,' + btoa(value);
}

</script>
