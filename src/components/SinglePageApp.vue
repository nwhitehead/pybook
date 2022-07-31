//!
//! SinglePageApp
//!
//! A Vue component representing the top level single-page app.
//!

<template>
    <div>
        <p>Hello to the Single Page App</p>
    </div>
    <Chooser v-model="choices" :fields="fields" @click="handleChooserClick" />
    <Notebook v-model="nbstate" />
</template>

<script setup>

import { onMounted, reactive, ref } from "vue";
import Notebook from "./Notebook.vue";
import Chooser from "./Chooser.vue";
import { blankState } from "../notebook.js";
import axios from 'axios';

onMounted(async () => {
    const res = await axios.get(`/notebooks`);
    choices.value = res.data;
});

let choices = ref([]);

let fields = [
    {name:'name', title:'Name'},
];

let nbstate = reactive(blankState);

async function handleChooserClick (item) {
    const res = await axios.get(`/notebook/${item.identifier}`);
    const newnbstate = res.data.contents;
    // Assign all fields of nbstate (can't just use = to assign because it will lose the reactivity)
    Object.assign(nbstate, newnbstate);
}

</script>
