//!
//! ConfigurationView
//!
//! A Vue component representing the configuration page
//!

<template>
    <div class="container">
        <TheConfiguration :configuration="configuration" :showGeneral="true" :showConsole="true" :showEditor="true" :showPython="true" />
        <TheKeyboardControls :configuration="configuration" />
    </div>
</template>

<script setup>

import { configuration } from '../globals.js';
import TheConfiguration from '../TheConfiguration.vue';
import TheKeyboardControls from '../TheKeyboardControls.vue';

</script>