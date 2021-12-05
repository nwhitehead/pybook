<template>
    <div class="output">
        <template v-for="value in values">
            <pre v-if="isStream(value)" :class="value.name">{{ value.text }}</pre>
            <DataOutput
                v-if="isExecuteResult(value) || isDisplayData(value)"
                v-bind:value="value.data"
                v-bind:isResult="isExecuteResult(value)"
            >
            </DataOutput>
        </template>
    </div>
</template>

<script>

import DataOutput from './DataOutput.vue';

export default {
    props: ['values'],
    methods: {
        isStream (value) {
            return value.output_type === 'stream';
        },
        isExecuteResult (value) {
            return value.output_type === 'execute_result';
        },
        isDisplayData (value) {
            return value.output_type === 'display_data';
        },
    },
    components: {
        DataOutput,
    },
}

</script>
