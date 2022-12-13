//!
//! Global variables accessible to all components
//!
//! Should be used sparingly. Not for general communication, more like global configuration.
//!

import { ref, watch, reactive } from 'vue';
import { storageBacked } from './storageBacked.js';
import mitt from 'mitt';

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
    'markStderr':true,
    'closeBrackets':false,
    'editLineNumbers':true,
    'editHighlightLine':true,
    'alternateInterrupt':false,
    'usePyPI':true,
    'showArrows':true,
}));

//! This eventbus is global to all components, used for ad hoc component communication
//! Bypasses props / events / emit normal Vue communication. Anyone can listen/emit on this
//! eventbus.
export const eventbus = new mitt();

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

export const cookieConsent = ref(null);

watch(
    // Getter
    () => configuration.darkmode,
    // Handler for changes
    () => updateBodyDark(),
);
