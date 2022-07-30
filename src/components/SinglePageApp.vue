//!
//! SinglePageApp
//!
//! A Vue component representing the top level single-page app.
//!

<template>
    <div>
        <p>Hello to the Single Page App</p>
    </div>
    <Chooser v-model="choices" :fields="fields" />
    <Notebook v-model="nbstate" />
</template>

<script setup>

import { reactive } from "vue";
import Notebook from "./Notebook.vue";
import Chooser from "./Chooser.vue";
import { blankState } from "../notebook.js";

let choices = [
    {name:'Document 1'},
    {name:'Second Doc'},
];

let fields = [
    {name:'name', title:'Name'},
];

let nbstate = reactive(blankState);

</script>
