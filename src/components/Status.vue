//!
//! Status
//!
//! A Vue component for showing kernel status. Uses icons from material. State is kept as a string.
//!
//! Allowed status states are:
//! - Initializing
//! - Ready
//! - Working
//! - Interrupt
//!
//! Currently does not validate status values.
//!

<template>
    <div class="status">
        <span class="material-icons" v-if="value=='Initializing'">cloud</span>
        <span class="material-icons" v-if="value=='Ready'">done</span>
        <span class="material-icons" v-if="value=='Working'">cloud</span>
        <span class="material-icons" v-if="value=='Interrupt'">report</span>
        <p>{{ value }}</p>
    </div>
</template>

<style>
div.status {
    display: inline-flex;
    width: auto;
    height: 32px;
    margin: 10px;
}
div.status p {
    padding: 0 0 0 5px;
    margin: 0;
    font-size: 10pt;
    font-family: monospace;
}
</style>

<script setup>
defineProps(['value']);
</script>
