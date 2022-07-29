// main.js
import SinglePageApp from './components/SinglePageApp.vue';
import VueCodemirror from 'vue-codemirror';
import { createApp } from 'vue';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-python';

// Global markdown rendering options
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

const app = createApp(SinglePageApp);
app.use(VueCodemirror, {
    // Set global Codemirror extension default list to empty
    // Otherwise we always get basic-setup extensions and cannot turn them off in CellInput
    extensions: []
});
app.mount('#app');
