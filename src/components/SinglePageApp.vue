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
    <Notebook v-model="nbstate" :mutated="mutated" />
</template>

<script setup>

import { onMounted, reactive, ref, watch, nextTick, onBeforeMount, onBeforeUnmount } from "vue";
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

// autosave
let identifier = ref(null);
let mutated = ref(false);

watch(nbstate, async (oldState, newState) => {
    console.log('nbstate changed to ', newState);
    mutated.value = true;
});

let autosaveTimer = null;

onBeforeMount(() => {
    autosaveTimer = setInterval(handleSave, 3000);
});

onBeforeUnmount(() => {
    clearIntervale(autosaveTimer);
});

async function handleSave () {
    if (identifier.value !== null && mutated.value) {
        console.log('saving to identifier ', identifier.value, nbstate);
        const unreactiveState = JSON.parse(JSON.stringify(nbstate));
        console.log('unreactiveState', unreactiveState);
        const res = await axios.post(`/notebook/${identifier.value}`, unreactiveState);
        console.log('result of post', res);
        mutated.value = false;
    }
}

async function handleChooserClick (item) {
    const res = await axios.get(`/notebook/${item.identifier}`);
    const newnbstate = res.data.contents;
    // Setup autosave variables
    identifier.value = item.identifier;
    // Assign all fields of nbstate (can't just use = to assign because it will lose the reactivity)
    Object.assign(nbstate, newnbstate);
    // Update mutated last since previous changes will trigger it
    nextTick(() => {
        mutated.value = false;
    });
}

</script>
