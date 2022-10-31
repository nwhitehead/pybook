//!
//! TestApp
//!
//! A Vue component representing the top level single-page test app.
//!

<template>
    <ConsoleInput v-model="entry" :options="options" />
</template>

<script setup>

import ConsoleInput from './ConsoleInput.vue';

import { ref } from 'vue';

let entry = ref('');

let options = {
    type:'python',
};

</script>
