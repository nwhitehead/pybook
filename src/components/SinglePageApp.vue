//!
//! SinglePageApp
//!
//! A Vue component representing the top level single-page app.
//!

<template>
    <div>
        <p>Hello to the Single Page App</p>
    </div>
    <Notebook v-model="state" />
</template>

<script setup>

import { reactive } from "vue";
import Notebook from "./Notebook.vue";
import Chooser from "./Chooser.vue";
import { blankState } from "../notebook.js";

let state = reactive(blankState);

</script>
