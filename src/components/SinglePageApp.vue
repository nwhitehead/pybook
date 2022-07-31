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
    console.log('SinglePageApp component created');
    const res = await axios.get(`/notebooks`);
    console.log('Got notebooks', res.data);
    choices.value = res.data;
});

let choices = ref([]);

let fields = [
    {name:'name', title:'Name'},
];

let nbstate = reactive(blankState);

async function handleChooserClick (item) {
    console.log('Handle chooser click for identifier ', item.identifier);
    const res = await axios.get(`/notebook/${item.identifier}`);
    console.log('Got notebook ', res.data);
}

</script>
