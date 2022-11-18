//!
//! Global variables accessible to all components
//!
//! Should be used sparingly. Not for general communication, more like global configuration.
//!

import { watch, reactive } from 'vue';
import { storageBacked } from './storageBacked.js';

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
    const html = document.querySelector('html');
    if (configuration.darkmode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}

watch(
    // Getter
    () => configuration.darkmode,
    // Handler for changes
    () => updateBodyDark(),
);
