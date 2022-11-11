//!
//! ConsoleApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <TheNavbar :dark="configuration.darkmode" />
    <section :class="{ section:true, dark:configuration.darkmode }">
        <div class="container">
            <div class="columns">
                <div class="column is-four-fifths">
                    <div class="box console">
                        <Console :eventbus="eventbus" :options="options" :pyoptions="pyoptions" :dark="configuration.darkmode" />
                    </div>
                </div>
                <div class="column is-one-fifth">
                    <TheConfiguration :configuration="configuration" :showGeneral="true" :showConsole="true" :showPython="true" />
                    <div class="box">
                        <div class="content">
                            <p class="subtitle is-4">Keyboard controls</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">Enter</span> evaluate</p>
                            <p><span class="tag">Shift</span>-<span class="tag">Enter</span> insert newline</p>
                            <p v-if="configuration.evalSingleLine" ><span class="tag">Enter</span> evaluate single line input</p>
                            <p v-if="!configuration.evalSingleLine" ><span class="tag">Enter</span> insert newline</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">C</span> interrupt Python</p>
                            <p><span class="tag">Up</span> / <span class="tag">Down</span> history</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">L</span> clear all output</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">Shift</span>-<span class="tag">L</span> to clear Python state and clear output</p>
                            <p><a href="hint.html" target="_blank">Usage Hints</a></p>
                        </div>
                    </div>
                </div>
            </div>
            <Feedback :disable="configuration.disableFeedback" :dark="configuration.darkmode" @send="send" />
        </div>
    </section>
</template>

<script setup>

import Console from './Console.vue';
import Feedback from './Feedback.vue';
import TheNavbar from './TheNavbar.vue';
import TheConfiguration from './TheConfiguration.vue';

import { computed, onMounted } from 'vue';
import axios from 'axios';
import mitt from 'mitt';

import { configuration, updateBodyDark } from './globals.js';

// Event bus for communicating back and forth with Console directly
const eventbus = mitt();

const options = computed(() => {
    return {
        evalSingleLine:configuration.evalSingleLine,
        lineNumbers:configuration.lineNumbers,
        closeBrackets:configuration.closeBrackets,
        wrap:configuration.wrap,
        fixedHeight:configuration.fixedHeight,
    };
});

const pyoptions = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

onMounted(() => updateBodyDark());

function send(evt) {
    // Fire off post request and ignore any errors at this point
    axios.post('/api/feedback', evt);
}

</script>
