//!
//! Controls component (play, stop, etc.)
//!
//! Props:
//! - buttons - Array of buttons, each of which has:
//!     - name - Name to show
//!     - icon - Icon to show (material icon name)
//!     - class - Any extra classes (dict)
//! - dark - Enable dark mode
//!
//! Emits:
//! - pressed - When a button is pressed, has payload of name
//!

<template>
    <a v-for="button in buttons" :class="{ button:true, dark:dark, ...button.class }" @click="$emit('pressed', button.name)">
        <span class="icon-text"><span class="icon"><span class="material-icons">{{button.icon}}</span></span><span>{{button.name}}</span></span>
    </a>
</template>

<style>

a.dark {

}

</style>

<script setup>

import { ref, watch } from 'vue';

const props = defineProps([ 'buttons', 'dark' ]);
const emit = defineEmits([ 'pressed' ]);

</script>
