<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
        <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
        <Dropdown></Dropdown>
        <CodeMirrorComponent></CodeMirrorComponent>
    </div>
</template>

<script>
import Vue from 'vue';
import EventBus from './EventBus.js';
import Status from './Status.vue';
import Pagination from './Pagination.vue';
import Dropdown from './Dropdown.vue';
import CodeMirrorComponent from './CodeMirrorComponent.vue';


export default {
    data: function () {
        return {
            'status': 'Initializing',
        }
    },
    components: {
        Status,
        Pagination,
        Dropdown,
        CodeMirrorComponent,
    }
}
</script>
