<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
        <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
        <Dropdown></Dropdown>
        <CodeMirrorComponent></CodeMirrorComponent>
        <DataOutput v-bind:value="testout" v-bind:isResult="true"></DataOutput>
        <CellOutput v-bind:values="covalues"></CellOutput>
        <CheckPoint v-bind:value="'0'" v-bind:type="'use'"></CheckPoint>
    </div>
</template>

<script>
import Vue from 'vue';
import EventBus from './EventBus.js';
import Status from './Status.vue';
import Pagination from './Pagination.vue';
import Dropdown from './Dropdown.vue';
import CodeMirrorComponent from './CodeMirrorComponent.vue';
import DataOutput from './DataOutput.vue';
import CellOutput from './CellOutput.vue';
import CheckPoint from './CheckPoint.vue';

export default {
    data: function () {
        return {
            'status': 'Initializing',
            'testout': {
                'text/plain': 'This is some pre formatted output',
            },
            'covalues': [
                {
                    output_type: 'stream',
                    name: 'stdout',
                    text: 'Hello world',
                },
            ],
        }
    },
    components: {
        Status,
        Pagination,
        Dropdown,
        CodeMirrorComponent,
        DataOutput,
        CellOutput,
        CheckPoint,
    }
}
</script>
