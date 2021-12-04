<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
        <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
    </div>
</template>

<script>
import Status from './Status.vue';
import Pagination from './Pagination.vue';

export default {
    data: function () {
        return {
            'status': 'Initializing',
        }
    },
    components: {
        Status,
        Pagination
    }
}
</script>
