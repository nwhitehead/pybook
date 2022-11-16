//!
//! ConsoleOutput
//!
//! A Vue component representing console output. Output may consist of text or other MIME types.
//!
//! Props:
//! - values - An array of outputs. Each element in the array has type suitable for DataOutput.
//! - wrap - Whether to wrap output long lines
//!

<template>
    <div :class="{ consoleoutput:true, nowrap:!wrap }">
        <template v-for="(value, index) in values">
            <DataOutput :value="value" :isLast="index === values.length - 1" />
        </template>
    </div>
</template>

<style>
div.consoleoutput {
    height: auto;
}
div.consoleoutput.nowrap {
    width: max-content;
}
</style>

<script setup>

import DataOutput from './DataOutput.vue';
import { ref, watch, onMounted } from 'vue';

const props = defineProps([ 'values', 'wrap' ]);

</script>
