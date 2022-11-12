//!
//! MultiApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar :dark="configuration.darkmode" />
    <section :class="{ section:true, dark:configuration.darkmode }">
        <div class="container">
            <component :is="currentView" />
            <Feedback :disable="configuration.disableFeedback" :dark="configuration.darkmode" @send="send" />
        </div>
    </section>
</template>

<script setup>

import ConsoleApp from './ConsoleApp.vue';
import CodeApp from './CodeApp.vue';
import Feedback from './Feedback.vue';
import TheNavbar from './TheNavbar.vue';
import MainView from './MainView.vue';
import NotFoundView from './NotFoundView.vue';
import UsageView from './UsageView.vue';

import axios from 'axios';
import { ref, computed, onMounted } from 'vue';

import { configuration, updateBodyDark } from './globals.js';

const currentPath = ref(window.location.hash);
window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash;
});

const routes = {
    '#/': MainView,
    '#/console': ConsoleApp,
    '#/code': CodeApp,
    '#/usage': UsageView,
};

const currentView = computed(() => {
    return routes[ currentPath.value || '#/' ] || NotFoundView;
});

onMounted(() => updateBodyDark());

function send(evt) {
    // Fire off post request and ignore any errors at this point
    axios.post('/api/feedback', evt);
}

</script>
