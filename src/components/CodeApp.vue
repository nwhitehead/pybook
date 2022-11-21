//!
//! CodeApp
//!
//! A Vue component representing the top level code panel app.
//!
//! Emits:
//! - codeAppComponentMounted - When component is ready. This is needed when clicking on examples in case the CodeApp is lazy loaded.
//!

<template>
    <Multipane layout="vertical">
        <div class="editorPane">
            <div class="box editor">
                <div class="control-container is-justify-content-space-between">
                    <div class="left-buttons">
                        <Controls :buttons="leftButtons" @pressed="pressed" />
                    </div>
                    <div class="right-buttons">
                        <Controls :buttons="rightButtons" @pressed="pressed" />
                    </div>
                </div>
                <CodeInput v-model="script" :options="optionsCode" 
                    @interrupt="interrupt"
                    @evaluate="evaluate"
                    @clear="clear"
                    @reset="reset"
                />
            </div>
        </div>
        <MultipaneResizer layout="vertical" />
        <div class="consolePane">
            <div class="box console consolePane">
                <Console :eventbus="consoleEventbus" :options="optionsConsole" :pyoptions="pyoptionsConsole"
                    @update:busy="(evt) => busy = evt"
                    @update:stdin="(evt) => stdin = evt"
                    @update:loading="(evt) => loading = evt"
                />
            </div>
        </div>
    </Multipane>
</template>

<style>
.editorPane {
    width: 50%;
    min-width: 25%;
    max-width: 80%;
    flex-shrink: 0;
    padding: 12px;
}
.consolePane {
    flex-grow: 1;
    flex-shrink: 1;
    padding: 12px;
    overflow: auto;
}
.control-container, .left-buttons, .right-buttons {
    display: flex;
}
</style>

<script setup>

import CodeInput from './CodeInput.vue';
import Console from './Console.vue';
import Controls from './Controls.vue';
import Multipane from './Multipane.vue';
import MultipaneResizer from './MultipaneResizer.vue';

import { computed, ref, onMounted } from 'vue';
import mitt from 'mitt';

import { configuration, updateBodyDark, eventbus } from './globals.js';
import { storageBackedRef } from './storageBacked.js';

const script = storageBackedRef('editcontents', ref(''));

const emit = defineEmits([ 'codeAppComponentMounted' ]);

// Event bus for communicating back and forth with Console directly
const consoleEventbus = mitt();

onMounted(() => {
    emit('codeAppComponentMounted');
});

const optionsCode = computed(() => {
    return {
        type:'python',
        dark:configuration.darkmode,
        lineNumbers:configuration.editLineNumbers,
        closeBrackets:configuration.closeBrackets,
        highlightLine:true,
        alternateInterrupt:configuration.alternateInterrupt,
        fixedHeight:true,
    };
});

const optionsConsole = computed(() => {
    return {
        evalSingleLine:configuration.evalSingleLine,
        lineNumbers:configuration.lineNumbers,
        closeBrackets:configuration.closeBrackets,
        wrap:configuration.wrap,
        fixedHeight:true,
        alternateInterrupt:configuration.alternateInterrupt,
        dark:configuration.darkmode,
        markStderr:configuration.markStderr,
    };
});

const pyoptionsConsole = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

const busy = ref(null);
const stdin = ref(null);
const loading = ref(null);

const leftButtons = computed(() => {
    let result = [];
    if (loading.value) {
        result.push({
            name:'Run',
            icon:'play_arrow',
            class:{ 'is-primary':true, 'is-loading':true },
            disabled:true,
        });
    } else if (!busy.value && !stdin.value) {
        result.push({
            name:'Run',
            icon:'play_arrow',
            class:{ 'is-primary':true },
        });
    } else {
        result.push({
            name:'Stop',
            icon:'stop',
            class:{ 'is-danger':true },
        });
    }
    return result;
});

const rightButtons = computed(() => {
    let result = [];
    result.push({
        name:'Clear',
        icon:'remove',
        class:{ },
    });
    return result;
});

function pressed(evt) {
    if (evt === 'Run') {
        consoleEventbus.emit('evaluate', {
            src:script.value,
        });
    }
    if (evt === 'Stop') {
        consoleEventbus.emit('interrupt');
    }
    if (evt === 'Clear') {
        consoleEventbus.emit('clear');
    }
}

function interrupt() {
    // Key shortcut for interrupt
    consoleEventbus.emit('interrupt');
}

function evaluate() {
    // Key shortcut for evaluate in editor
    if (!busy.value && !stdin.value) {
        consoleEventbus.emit('evaluate', {
            src:script.value,
        });
    }
}

function clear() {
    // Key shortcut for clear output
    consoleEventbus.emit('clear');
}

function reset() {
    // Key shortcut for reset
    consoleEventbus.emit('reset');
}

eventbus.on('example', (payload) => {
    // Switch to example
    // CodeMirror will see this as a big edit, user can do Undo and Redo with it to get back to their work if needed.
    script.value = payload.code;
});

</script>
