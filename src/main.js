// main.js
import Notebook from './components/Notebook.vue';
import Vue from 'vue';

new Vue({
    el: '#notebook',
    render: h => h(Notebook),
});
