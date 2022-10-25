//!
//! SinglePageApp
//!
//! A Vue component representing the top level single-page app.
//!

<template>
    <Chooser v-model="choices" :fields="fields" @click="handleChooserClick" />
    <Notebook v-model="nbstate" :mutated="mutated" />
</template>

<script setup>

import { onMounted, reactive, ref, watch, nextTick, onBeforeMount, onBeforeUnmount } from "vue";
import Notebook from "./Notebook.vue";
import Chooser from "./Chooser.vue";
import { blankState } from "../notebook.js";
import { freshId } from "../fresh.js";
import { parse, unparse } from "../parser.js";
import axios from "axios";

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
        const id = identifier.value;
        // Prevent nested saves while waiting for this save to finish
        identifier.value = null;
        // Get notebook state as standard JS object without reactivity
        const unreactiveState = JSON.parse(JSON.stringify(nbstate));
        // Convert from JSON format to PBNB format with unparse
        const unparsed = unparse(unreactiveState);
        try {
            const res = await axios.post(`/notebook/${id}`, unparsed);
            mutated.value = false;
        }
        finally {
            identifier.value = id;
        }
    }
}

async function handleChooserClick (item) {
    await handleSave();
    const res = await axios.get(`/notebook/${item.identifier}`);
    const newnbstate = parse(res.data.contents);
    freshId(newnbstate);
    // Setup autosave variables
    identifier.value = item.identifier;
    // Assign all fields of nbstate (can't just use = to assign because it will lose the reactivity)
    Object.assign(nbstate, newnbstate);
    // Update mutated last since previous changes will trigger it
    nextTick(() => {
        //mutated.value = false;
    });
}

</script>
