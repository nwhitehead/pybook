
<template>
    <div class="dataoutput">
        <pre v-if="isPre(value)" :class="getClass(value)">
            <img v-if="isResult" src="../gfx/right2.svg" width=10 height=10></img>
            {{ value['text/plain'] }}
        </pre>
        <div v-if="isHtml(value)" :class="getClass(value)"><img v-if="isResult" src="../gfx/right2.svg" width=10 height=10></img>
            <div class="content" v-html="value['text/html']"></div>
        </div>
        <img v-if="isSVG(value)" :src="dataURI(value['image/svg+xml'])" />
    </div>
</template>

<script>

export default {
    props: ['value', 'isResult'],
    methods: {
        getClass (value) {
            if (this.isPre(value)) return 'stdout';
            if (this.isHtml(value)) return 'html';
            return 'stdout';
        },
        isPre (value) {
            return value['text/plain'] !== undefined;
        },
        isHtml (value) {
            return value['text/html'] !== undefined;
        },
        isSVG (value) {
            return value['image/svg+xml'] !== undefined;
        },
        dataURI (value) {
            // btoa is a builtin web API function converting bytes to base64 encoded values
            return 'data:image/svg+xml;base64,' + btoa(value);
        }
    }
}

</script>
