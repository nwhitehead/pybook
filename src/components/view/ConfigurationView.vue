//!
//! ConfigurationView
//!
//! A Vue component representing the configuration page
//!

<template>
    <TheConfiguration :configuration="configuration" :showGeneral="true" :showConsole="true" :showEditor="true" :showPython="true" />
    <TheKeyboardControls :configuration="configuration" />
</template>

<script setup>

import { configuration } from '../globals.js';
import TheConfiguration from '../TheConfiguration.vue';
import TheKeyboardControls from '../TheKeyboardControls.vue';

</script>