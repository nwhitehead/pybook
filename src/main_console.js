// main_console.js
import App from './components/ConsoleApp.vue';
import VueCodemirror from 'vue-codemirror';
import { createApp } from 'vue';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python.js';

marked.setOptions({
    highlight: (code, lang) => {
        if (Prism.languages[lang]) {
            return Prism.highlight(code, Prism.languages[lang], lang);
        } else {
            return code;
        }
    },
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: true,
});

const app = createApp(App);
app.use(VueCodemirror, {
    // Set global Codemirror extension default list to empty
    // Otherwise we always get basic-setup extensions and cannot turn them off in components
    extensions: []
});
app.mount('#app');
