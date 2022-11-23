//!
//! ConsoleApp
//!
//! A Vue component representing the top level single-page console app.
//!
//! Emits:
//! - consoleAppComponentMounted - When component is ready. This is needed when clicking on examples in case the ConsoleApp is lazy loaded.
//!

<template>
    <div class="columns">
        <div class="column is-four-fifths">
            <div class="box console">
                <Console :eventbus="consoleEventbus" :options="options" :pyoptions="pyoptions" />
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

import { configuration, updateBodyDark, eventbus } from './globals.js';

const emit = defineEmits([ 'consoleAppComponentMounted' ]);

// Event bus for communicating back and forth with Console directly
const consoleEventbus = mitt();

onMounted(() => {
    emit('consoleAppComponentMounted');
});

const options = computed(() => {
    return {
        evalSingleLine:configuration.evalSingleLine,
        lineNumbers:configuration.lineNumbers,
        closeBrackets:configuration.closeBrackets,
        wrap:configuration.wrap,
        fixedHeight:configuration.fixedHeight,
        alternateInterrupt:configuration.alternateInterrupt,
        dark:configuration.darkmode,
        markStderr:configuration.markStderr,
    };
});

const pyoptions = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

eventbus.on('console:example', (payload) => {
    // Paste in example to input text
    consoleEventbus.emit('update:input', payload.code);
});

</script>
