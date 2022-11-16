//!
//! TheKeyboardControls
//!
//! A Vue component representing keyboard control help
//!
//! Props:
//! - configuration - Dictionary of configuration options (used to tweak text to be accurate)
//!

<template>
    <div class="box">
        <div class="content">
            <p class="subtitle is-4">Keyboard controls</p>
            <p><span class="tag">Ctrl</span>-<span class="tag">Enter</span> evaluate</p>
            <p><span class="tag">Shift</span>-<span class="tag">Enter</span> insert newline</p>
            <p v-if="configuration.evalSingleLine" ><span class="tag">Enter</span> evaluate single line input</p>
            <p v-if="!configuration.evalSingleLine" ><span class="tag">Enter</span> insert newline</p>
            <p v-if="configuration.alternateInterrupt"><span class="tag">Ctrl</span>-<span class="tag">I</span> interrupt Python</p>
            <p v-if="!configuration.alternateInterrupt"><span class="tag">Ctrl</span>-<span class="tag">C</span> interrupt Python</p>
            <p><span class="tag">Up</span> / <span class="tag">Down</span> history</p>
            <p><span class="tag">Ctrl</span>-<span class="tag">L</span> clear all output</p>
            <p><span class="tag">Ctrl</span>-<span class="tag">Shift</span>-<span class="tag">L</span> to clear Python state and clear output</p>
            <p><a href="#/usage">Usage Hints</a></p>
        </div>
    </div>
</template>

<script setup>

import { configuration } from './globals.js';

const props = defineProps([ 'configuration ']);

</script>
