// main.js
import Notebook from './components/Notebook.vue';
import VueCodemirror from "vue-codemirror";
import { createApp } from 'vue';
import { createPinia } from 'pinia'

const pinia = createPinia();
const app = createApp(Notebook);
app.use(VueCodemirror, {
    // Set global Codemirror extension default list to empty
    // Otherwise we always get basic-setup extensions and cannot turn them off in CellInput
    extensions: []
});
app.use(pinia);
app.mount('#notebook');
