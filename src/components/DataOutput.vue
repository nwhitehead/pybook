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
//! (The string I want to put in place of REDACTED breaks the Vue esbuild compile...)
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
        <img v-if="isSVG(value)" :src="dataURI('image/svg+xml', value)" />
        <img v-if="isPNG(value)" :src="dataURI('image/png', value)" />
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
    if (props.value['text/html']) {
        return DOMPurify.sanitize(props.value['text/html']);
    }
    return '';
});
const preContent = computed(() => {
    if (props.value['text/plain']) {
        return DOMPurify.sanitize(convert.toHtml(escapeHtml(props.value['text/plain'])));
    }
    return '';
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
    if (isPNG(value)) return 'png';
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

function isPNG (value) {
    if (value === undefined) return false;
    return value['image/png'] !== undefined;
}


// Following 2 functions from:
// https://developer.mozilla.org/en-US/docs/Glossary/Base64#Solution_.232_.E2.80.93_rewriting_atob%28%29_and_btoa%28%29_using_TypedArrays_and_UTF-8

/* Base64 string to array encoding */
function uint6ToB64(nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
    ? nUint6 + 71
    : nUint6 < 62
    ? nUint6 - 4
    : nUint6 === 62
    ? 43
    : nUint6 === 63
    ? 47
    : 65;
}

function base64EncArr(aBytes) {
  let nMod3 = 2;
  let sB64Enc = "";

  const nLen = aBytes.length;
  let nUint24 = 0;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && ((nIdx * 4) / 3) % 76 === 0) {
      sB64Enc += "\r\n";
    }

    nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCodePoint(
        uint6ToB64((nUint24 >>> 18) & 63),
        uint6ToB64((nUint24 >>> 12) & 63),
        uint6ToB64((nUint24 >>> 6) & 63),
        uint6ToB64(nUint24 & 63)
      );
      nUint24 = 0;
    }
  }
  return (
    sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
    (nMod3 === 2 ? "" : nMod3 === 1 ? "=" : "==")
  );
}

function dataURI (type, value, textmode) {
    // Would just use btoa for everything, but this function doesn't work in JavaScript
    // Need to encodeURI then unescape to workaround characters outside latin1 range for text mode
    if (textmode) {
        return 'data:' + type + ';base64,' + btoa(unescape(encodeURIComponent(value[type])));
    }
    // Binary mode has Uint8Array coming in
    return 'data:' + type + ';base64,' + base64EncArr(value[type]);
}

</script>
