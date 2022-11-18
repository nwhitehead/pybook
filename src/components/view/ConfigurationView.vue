//!
//! ConfigurationView
//!
//! A Vue component representing the configuration page
//!

<template>
    <div class="container">
        <TheConfiguration :showGeneral="true" :showConsole="true" :showEditor="true" :showPython="true" />
        <TheKeyboardControls />
    </div>
</template>

<script setup>

import TheConfiguration from '../TheConfiguration.vue';
import TheKeyboardControls from '../TheKeyboardControls.vue';

</script>