//!
//! DataOutput
//!
//! A Vue component representing the content of data output cells. Types include:
//! * Python text output
//! * HTML content
//! * SVG content
//!
//! Props:
//!   value - This is a dict with keys of MIME type and value of content. MIME types are:
//!     - text/plain
//!     - text/html
//!     - image/svg+xml
//!

<template>
    <div class="dataoutput">
        <pre v-if="isPre(value)" :class="getClass(value)">
            {{value['text/plain']}}
        </pre>
        <div v-if="isHtml(value)" :class="getClass(value)">
            <div class="content" v-html="value['text/html']"></div>
        </div>
        <img v-if="isSVG(value)" :src="dataURI(value['image/svg+xml'])" />
    </div>
</template>

<script>

export default {
    props: ['value'],
    methods: {
        getClass (value) {
            if (this.isPre(value)) return 'stdout';
            if (this.isHtml(value)) return 'html';
            return 'stdout';
        },
        isPre (value) {
            if (value === undefined) return false;
            return value['text/plain'] !== undefined;
        },
        isHtml (value) {
            if (value === undefined) return false;
            return value['text/html'] !== undefined;
        },
        isSVG (value) {
            if (value === undefined) return false;
            return value['image/svg+xml'] !== undefined;
        },
        dataURI (value) {
            // btoa is a builtin web API function converting bytes to base64 encoded values
            return 'data:image/svg+xml;base64,' + btoa(value);
        }
    }
}

</script>
