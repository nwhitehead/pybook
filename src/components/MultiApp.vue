//!
//! MultiApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar @config="configActive=true;" @report="feedbackActive=true" />
    <Feedback :active="feedbackActive" :disable="configuration.disableFeedback" @send="send" @update:active="newValue => { feedbackActive = newValue; }" />
    <TheConfiguration :active="configActive" :showGeneral="true" :showConsole="true" :showEditor="true" :showPython="true" @close="configActive=false;" />
    <section class="section">
        <KeepAlive>
            <component :is="currentView.component" v-bind="currentView.props"
                @codeAppComponentMounted="codeAppComponentMounted"
                @consoleAppComponentMounted="consoleAppComponentMounted"
            />
        </KeepAlive>
    <TheFooter />
    <vue-cookie-accept-decline
        :debug="false"
        :disableDecline="false"
        :showPostponeButton="false"
        @clicked-accept="clickAccept"
        @clicked-decline="clickDecline"
        @status="setCookieValue"
        elementId="myCookiePanel"
        position="bottom-left"
        ref="myCookiePanel"
        transitionName="slideFromBottom"
        type="floating">
        <!-- Optional -->
        <template #postponeContent>&times;</template>

        <!-- Optional -->
        <template #message>
            We use cookies to ensure you get the best experience on our website.
            Consenting to these cookies is not required to use the tools on this site.
            Cookies are used for the newsletter subscription form.
            <a href="/sab/#/about">Learn More...</a>
        </template>

        <!-- Optional -->
        <template #declineContent>Decline</template>

        <!-- Optional -->
        <template #acceptContent>Accept</template>
    </vue-cookie-accept-decline>
    </section>
</template>

<style>
.cookie__floating {
    max-width: 500px;
}
.cookie__floating__content
{
    max-height: none;
}
</style>

<script setup>

import ConsoleApp from './ConsoleApp.vue';
import CodeApp from './CodeApp.vue';
import Feedback from './Feedback.vue';
import TheFooter from './TheFooter.vue';
import TheNavbar from './TheNavbar.vue';
import TheConfiguration from './TheConfiguration.vue';
import MainView from './view/MainView.vue';
import NotFoundView from './view/NotFoundView.vue';
import AboutView from './view/AboutView.vue';
import RoadmapView from './view/RoadmapView.vue';
import ExampleFromFileView from './view/ExampleFromFileView.vue';

import axios from 'axios';
import { ref, computed, onMounted, watch } from 'vue';
import VueCookieAcceptDecline from 'vue-cookie-accept-decline';
import 'vue-cookie-accept-decline/dist/vue-cookie-accept-decline.css';

import { configuration, cookieConsent, updateBodyDark, eventbus } from './globals.js';
import { hasSharedArrayBuffer } from '../polyfill.js';

import waveFileContents from '../../examples/wave.py?raw';
import usageFileContents from '../../examples/usage.py?raw';

function clickAccept() {
    cookieConsent.value = 'accept';
}

function clickDecline() {
    cookieConsent.value = 'decline';
}

function setCookieValue(payload) {
    cookieConsent.value = payload;
}

const currentPath = ref(window.location.hash);
window.addEventListener('hashchange', () => {
    currentPath.value = window.location.hash;
});

// Whether to show configuration modal overlay (default is not to show)
let configActive = ref(false);

// Whether to show feedback modal overlay (default is not to show)
let feedbackActive = ref(false);

const routes = {
    '#/':  { component: MainView, props: {} },
    '#/console': { component: ConsoleApp, props: {} },
    '#/code': { component: CodeApp, props: {} },
    '#/usage': { component: ExampleFromFileView, props: { fileContents: usageFileContents, } },
    '#/about': { component: AboutView, props: {} },
    '#/roadmap': { component: RoadmapView, props: {} },
    '#/example': { component: ExampleFromFileView, props: { fileContents: waveFileContents, } },
};

const currentView = computed(() => {
    const notFound = { component: NotFoundView, props: {} };
    const view = routes[ currentPath.value || '#/' ] || notFound;
    if (hasSharedArrayBuffer) {
        return view;
    }
    // If we don't have SharedArrayBuffer, never even try to render ConsoleApp or CodeApp
    if (view.component === CodeApp || view.component === ConsoleApp) {
        return notFound;
    }
    return view;
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
