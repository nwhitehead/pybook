// main_console.js
import App from './components/CodeApp.vue';
import VueCodemirror from 'vue-codemirror';
import { createApp } from 'vue';

import 'bulma/css/bulma.css';

const app = createApp(App);
app.use(VueCodemirror, {
    // Set global Codemirror extension default list to empty
    // Otherwise we always get basic-setup extensions and cannot turn them off in components
    extensions: []
});
app.mount('#app');
