<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
        <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
        <Dropdown></Dropdown>
        <CodeMirrorComponent></CodeMirrorComponent>
        <DataOutput v-bind:value="testout" v-bind:isResult="true"></DataOutput>
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

export default {
    data: function () {
        return {
            'status': 'Initializing',
            'testout': {
                'text/plain': 'This is some pre formatted output',
            },
        }
    },
    components: {
        Status,
        Pagination,
        Dropdown,
        CodeMirrorComponent,
        DataOutput,
    }
}
</script>
