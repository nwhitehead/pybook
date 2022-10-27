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
import Notebook from './Notebook.vue';
import Chooser from './Chooser.vue';
import { blankState } from '../notebook.js';
import { get_notebooks, get_notebook, set_notebook, new_notebook, get_local_notebooks, set_local_notebooks } from '../storage.js';

onMounted(async () => {
    choices.value = await get_notebooks();
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
        const item = identifier.value;
        // Prevent nested saves while waiting for this save to finish
        identifier.value = null;
        try {
            const result = await set_notebook(item, nbstate);
            if (!result) {
                // Save failed, turn notebook into local copy
                console.log('Creating local copy');
                let newnb = await new_notebook(choices.value, item);
                console.log(newnb);
                identifier.value = newnb;
                mutated.value = true;
                let local_notebooks = await get_local_notebooks();
                console.log('Updating local_notebooks, currently', local_notebooks);
                local_notebooks.push(newnb);
                await set_local_notebooks(local_notebooks);
                choices.value = await get_notebooks();
                handleSave();
            }
            mutated.value = false;
        }
        finally {
            identifier.value = item;
        }
    }
}

async function handleChooserClick (item) {
    // Try to save any existing changes to previously chosen notebook we are replacing as needed
    await handleSave();
    const newnbstate = await get_notebook(item);
    // Setup autosave variables
    identifier.value = item;
    // Assign all fields of nbstate (can't just use = to assign because it will lose the reactivity)
    Object.assign(nbstate, newnbstate);
    // Update mutated last since previous changes will trigger it
    nextTick(() => {
        mutated.value = false;
    });
}

</script>
