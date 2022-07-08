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

<template>
    <div class="dataoutput">
        <pre v-if="isPre(value)" :class="getClass(value)">{{value['text/plain']}}</pre>
        <div v-if="isHtml(value)" :class="getClass(value)">
            <div class="content" v-html="value['text/html']" />
        </div>
        <img v-if="isSVG(value)" :src="dataURI(value['image/svg+xml'])" />
    </div>
</template>

<script setup>

defineProps(['value']);

function getClass (value) {
    if (this.isPre(value)) {
        if (value.name === 'stderr') {
            return 'stderr';
        }
        // Default to stdout if there is no name
        return 'stdout';
    }
    if (this.isHtml(value)) return 'html';
    if (this.isSVG(value)) return 'svg';
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
