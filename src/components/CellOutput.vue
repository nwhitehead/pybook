//!
//! CellOutput
//!
//! A Vue component representing cell output. Output may consist of text or other MIME types.
//!
//! Props:
//! - values - An array of outputs. Each element in the array has type suitable for DataOutput.
//!

<template>
    <div class="celloutput">
        <template v-for="value in values">
            <DataOutput v-bind:value="value" />
        </template>
    </div>
</template>

<style>
.celloutput {
    height: auto;
}
</style>

<script setup>

import DataOutput from './DataOutput.vue';

defineProps(['values']);

</script>
