//!
//! MultiApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar :dark="configuration.darkmode" />
    <section :class="{ section:true, dark:configuration.darkmode }">
        <KeepAlive>
            <component :is="currentView" @codeAppComponentMounted="codeAppComponentMounted" />
        </KeepAlive>
        <Feedback :disable="configuration.disableFeedback" :dark="configuration.darkmode" @send="send" />
    <TheFooter :dark="configuration.darkmode" />
    </section>
</template>

<script setup>

import ConsoleApp from './ConsoleApp.vue';
import CodeApp from './CodeApp.vue';
import Feedback from './Feedback.vue';
import TheFooter from './TheFooter.vue';
import TheNavbar from './TheNavbar.vue';
import ConfigurationView from './view/ConfigurationView.vue';
import MainView from './view/MainView.vue';
import NotFoundView from './view/NotFoundView.vue';
import UsageView from './view/UsageView.vue';

import axios from 'axios';
import { ref, computed, onMounted } from 'vue';

import { configuration, updateBodyDark, eventbus } from './globals.js';

const currentPath = ref(window.location.hash);
window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash;
});

const routes = {
    '#/': MainView,
    '#/console': ConsoleApp,
    '#/code': CodeApp,
    '#/configuration': ConfigurationView,
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

let examplePayload = null;

eventbus.on('example', (payload) => {
    window.location.hash = '#/code';
    // Changing the hash triggers event listener, is enough to change component
    // CodeApp component listens for same event, will handle update state for itself

    // If code editor was lazy loaded and not present, remember it and re-send the event once editor component is mounted
    examplePayload = payload;
});

function codeAppComponentMounted(evt) {
    console.log("CodeApp Component mounted", evt);
    if (examplePayload !== null) {
        eventbus.emit('example', examplePayload);
        examplePayload = null;
    }
}

</script>
