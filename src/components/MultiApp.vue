//!
//! MultiApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar :dark="configuration.darkmode" />
    <section :class="{ section:true, dark:configuration.darkmode }">
        <div class="container">
            <ConsoleApp />
            <Feedback :disable="configuration.disableFeedback" :dark="configuration.darkmode" @send="send" />
        </div>
    </section>
</template>

<script setup>

import ConsoleApp from './ConsoleApp.vue';
import Feedback from './Feedback.vue';
import TheNavbar from './TheNavbar.vue';

import axios from 'axios';
import { onMounted } from 'vue';

import { configuration, updateBodyDark } from './globals.js';

onMounted(() => updateBodyDark());

function send(evt) {
    // Fire off post request and ignore any errors at this point
    axios.post('/api/feedback', evt);
}

</script>
