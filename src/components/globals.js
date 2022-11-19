//!
//! Global variables accessible to all components
//!
//! Should be used sparingly. Not for general communication, more like global configuration.
//!

import { watch, reactive } from 'vue';
import { storageBacked } from './storageBacked.js';

import prismlight from './prism-one-light.css?inline';
import prismdark from './prism-one-dark.css?inline';

function userPrefersDark() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const configuration = storageBacked('config', reactive({
    'darkmode':userPrefersDark(),
    'disableFeedback':false,
    'evalSingleLine':true,
    'wrap':true,
    'lineNumbers':false,
    'fixedHeight':false,
    'closeBrackets':false,
    'editLineNumbers':true,
    'alternateInterrupt':false,
    'usePyPI':true,
}));

export function updateBodyDark() {
    const prismtheme = document.getElementById('prismtheme');
    if (configuration.darkmode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        prismtheme.innerHTML = prismdark;
    } else {
        document.documentElement.setAttribute('data-theme', '');
        prismtheme.innerHTML = prismlight;
    }
}

watch(
    // Getter
    () => configuration.darkmode,
    // Handler for changes
    () => updateBodyDark(),
);
