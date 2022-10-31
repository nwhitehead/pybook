//!
//! ConsoleOutput
//!
//! A Vue component representing console output. Output may consist of text or other MIME types.
//!
//! Props:
//! - values - An array of outputs. Each element in the array has type suitable for DataOutput.
//!

<template>
    <div class="consoleoutput">
        <template v-for="value in values">
            <DataOutput v-bind:value="value" />
        </template>
    </div>
</template>

<style>
.consoleoutput {
    height: auto;
}
</style>

<script setup>

import DataOutput from './DataOutput.vue';
import { ref, watch, onMounted } from 'vue';

const props = defineProps(['values']);

</script>
