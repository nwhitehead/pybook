//!
//! CodeApp
//!
//! A Vue component representing the top level code panel app.
//!

<template>
    <div class="columns">
        <div class="column is-three-fifths">
            <div class="box editor">
                <Controls :buttons="buttons" :dark="configuration.darkmode" 
                    @pressed="pressed"
                />
                <CodeInput v-model="script" :options="optionsCode" 
                    @interrupt="interrupt"
                    @evaluate="evaluate"
                    @clear="clear"
                    @reset="reset"
                />
            </div>
        </div>
        <div class="column is-two-fifths">
            <div class="box console">
                <Console :eventbus="eventbus" :options="optionsConsole" :pyoptions="pyoptionsConsole" :dark="configuration.darkmode"
                    @update:busy="(evt) => busy = evt"
                    @update:stdin="(evt) => stdin = evt"
                />
            </div>
        </div>
    </div>
</template>

<script setup>

import CodeInput from './CodeInput.vue';
import Console from './Console.vue';
import Controls from './Controls.vue';

import { computed, ref } from 'vue';
import mitt from 'mitt';

import { configuration, updateBodyDark } from './globals.js';

const script = ref('');

// Event bus for communicating back and forth with Console directly
const eventbus = mitt();

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
    };
});

const pyoptionsConsole = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

const busy = ref(null);
const stdin = ref(null);

const buttons = computed(() => {
    let result = [];
    if (!busy.value && !stdin.value) {
        result.push({ name:'Run', icon:'play_arrow', class:{ 'is-primary':true }});
    } else {
        result.push({ name:'Stop', icon:'stop', class:{ 'is-danger':true }});
    }
    return result;
});

function pressed(evt) {
    if (evt === 'Run') {
        eventbus.emit('evaluate', {
            src:script.value,
        });
    }
    if (evt === 'Stop') {
        eventbus.emit('interrupt');
    }
}

function interrupt() {
    // Key shortcut for interrupt
    eventbus.emit('interrupt');
}

function evaluate() {
    // Key shortcut for evaluate in editor
    if (!busy.value && !stdin.value) {
        eventbus.emit('evaluate', {
            src:script.value,
        });
    }
}

function clear() {
    // Key shortcut for clear output
    eventbus.emit('clear');
}

function reset() {
    // Key shortcut for reset
    eventbus.emit('reset');
}

</script>
