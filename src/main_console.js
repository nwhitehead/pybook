// main_console.js
import SinglePageApp from './components/ConsoleInput.vue';
import VueCodemirror from 'vue-codemirror';
import { createApp } from 'vue';

const app = createApp(SinglePageApp);
app.use(VueCodemirror, {
    // Set global Codemirror extension default list to empty
    // Otherwise we always get basic-setup extensions and cannot turn them off in components
    extensions: []
});
app.mount('#app');
