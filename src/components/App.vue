<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
    </div>
</template>

<script>
import Status from './Status.vue';

export default {
    data: function () {
        return {
            'status': 'Initializing',
        }
    },
    components: {
        Status
    }
}
</script>
