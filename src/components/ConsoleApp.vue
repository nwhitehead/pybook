//!
//! ConsoleApp
//!
//! A Vue component representing the top level single-page console app.
//!

<template>
    <div class="columns">
        <div class="column is-four-fifths">
            <div class="box console">
                <Console :eventbus="eventbus" :options="options" :pyoptions="pyoptions" :dark="configuration.darkmode" />
            </div>
        </div>
        <div class="column is-one-fifth">
            <TheConfiguration :configuration="configuration" :showGeneral="true" :showConsole="true" :showPython="true" />
            <TheKeyboardControls :configuration="configuration" />
        </div>
    </div>
</template>

<script setup>

import Console from './Console.vue';
import TheConfiguration from './TheConfiguration.vue';
import TheKeyboardControls from './TheKeyboardControls.vue';

import { computed, onMounted } from 'vue';
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
        alternateInterrupt:configuration.alternateInterrupt,
    };
});

const pyoptions = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

</script>
