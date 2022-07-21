//!
//! Dropdown
//!
//! This component represents a dropdown menu of actions that can be selected.
//!
//! Props:
//! - name - The name of the main menu item (clickable to toggle state of menu beneath)
//! - values - Array of dictionaries, each entry has:
//!    - text - Label to put in menu
//!    - action - callback function when selected
//!    - divider - true if the element is a horizontal divider (no action)
//!    - filesave - true if the element is a filesave (special action)
//!

<template>
    <div :class="dropdownClasses">
        <div class="dropdown-trigger">
            <button class="button" aria-haspopups="true" :aria-controls="name" @click="toggleDropdown()" @blur="hideDropdown()">
                <span>{{ name }}</span>
            </button>
        </div>
        <div class="dropdown-menu" :id="name" role="menu">
            <div class="dropdown-content">
                <template v-for="value in values">
                    <a class="dropdown-item"
                        v-if="!value.divider"
                        @mousedown.prevent=""
                        @click="handle(value.action)">
                        {{ value.text }}
                    </a>
                    <a class="dropdown-divider" v-if="value.divider"></a>
                    <!-- <filesave v-if="value.filesave" v-bind:value="{}"></filesave> -->
                </template>
            </div>
        </div>
    </div>
</template>

<style>
</style>

<script setup>

import { computed, ref } from 'vue';

const props = defineProps(['name', 'values']);

// Race condition on clicking items and blurring main dropdown - resolve by preventing default of mousedown
// Mousedown happens before blur, the preventdefault stops the blur, then the click action happens which can hide the dropdown.

let isActive = ref(false);

const dropdownClasses = computed(() => {
    return isActive.value ? "dropdown is-active" : "dropdown";
});

function toggleDropdown () {
    isActive.value = !isActive.value;
}
function hideDropdown () {
    isActive.value = false;
}
function handle(action) {
    action();
    hideDropdown();
}
</script>
