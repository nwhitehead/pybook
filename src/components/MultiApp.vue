//!
//! MultiApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar />
    <section class="section">
        <KeepAlive>
            <component :is="currentView"
                @codeAppComponentMounted="codeAppComponentMounted"
                @consoleAppComponentMounted="consoleAppComponentMounted"
            />
        </KeepAlive>
        <Feedback :disable="configuration.disableFeedback" @send="send" />
    <TheFooter />
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
import { ref, computed, onMounted, watch } from 'vue';

import { configuration, updateBodyDark, eventbus } from './globals.js';
import { hasSharedArrayBuffer } from '../polyfill.js';

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

const noSABRoutes = {
    '#/': MainView,
    '#/console': NotFoundView,
    '#/code': NotFoundView,
    '#/configuration': ConfigurationView,
    '#/usage': UsageView,
};

const currentView = computed(() => {
    if (hasSharedArrayBuffer) {
        return routes[ currentPath.value || '#/' ] || NotFoundView;
    }
    return noSABRoutes[ currentPath.value || '#/' ] || NotFoundView;
});

watch(currentView, (newValue, oldValue) => {
    // Scroll main page to top when switching components
    // (Fixes issue with going low on Usage page, then switching to code editor, scrolled too far down)
    window.scrollTo(0, 0);
});

onMounted(() => updateBodyDark());

function send(evt) {
    // Fire off post request and ignore any errors at this point
    axios.post('/api/feedback', evt);
}

let editorExamplePayload = null;
let consoleExamplePayload = null;

eventbus.on('editor:example', (payload) => {
    window.location.hash = '#/code';
    // Changing the hash triggers event listener, is enough to change component
    // CodeApp component listens for same event, will handle update state for itself

    // If code editor was lazy loaded and not present, remember it and re-send the event once editor component is mounted
    editorExamplePayload = payload;
});

eventbus.on('console:example', (payload) => {
    window.location.hash = '#/console';
    consoleExamplePayload = payload;
});

function codeAppComponentMounted(evt) {
    // Look for missed events that we need to handle now that component is mounted
    if (editorExamplePayload !== null) {
        eventbus.emit('editor:example', editorExamplePayload);
        editorExamplePayload = null;
    }
}

function consoleAppComponentMounted(evt) {
    // Look for missed events that we need to handle now that component is mounted
    if (consoleExamplePayload !== null) {
        eventbus.emit('console:example', consoleExamplePayload);
        consoleExamplePayload = null;
    }
}

</script>
