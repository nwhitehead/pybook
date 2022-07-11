
<template>
    <div :class="dropdownClasses">
        <div class="dropdown-trigger">
            <button class="button" aria-haspopups="true" :aria-controls="name" @click="toggleDropdown()" v-on:blur="hideDropdown()">
                <span>{{ name }}</span>
            </button>
        </div>
        <div class="dropdown-menu" :id="name" role="menu">
            <div class="dropdown-content">
                <template v-for="value in values">
                    <a class="dropdown-item" v-if="!value.divider"
                        v-on:mousedown.prevent=""
                        v-on:click="handle(value.action)">
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
