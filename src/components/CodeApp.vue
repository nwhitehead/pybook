//!
//! CodeApp
//!
//! A Vue component representing the top level code panel app.
//!

<template>
    <section :class="{ section:true, dark:configuration.darkmode }">
        <div class="container">
            <div class="columns">
                <div class="column is-half">
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
                <div class="column is-half">
                    <div class="box console">
                        <Console :eventbus="eventbus" :options="optionsConsole" :pyoptions="pyoptionsConsole" :dark="configuration.darkmode"
                            @update:busy="(evt) => busy = evt"
                            @update:stdin="(evt) => stdin = evt"
                        />
                    </div>
                </div>
            </div>
            <div class="columns">
                <div class="column is-half">
                    <div class="box">
                        <div class="content">
                            <p class="subtitle is-4">Keyboard controls</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">Enter</span> evaluate</p>
                            <p><span class="tag">Shift</span>-<span class="tag">Enter</span> insert newline</p>
                            <p v-if="configuration.evalSingleLine" ><span class="tag">Enter</span> evaluate single line input</p>
                            <p v-if="!configuration.evalSingleLine" ><span class="tag">Enter</span> insert newline</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">C</span> interrupt Python</p>
                            <p><span class="tag">Up</span> / <span class="tag">Down</span> history</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">L</span> clear all output</p>
                            <p><span class="tag">Ctrl</span>-<span class="tag">Shift</span>-<span class="tag">L</span> to clear Python state and clear output</p>
                            <p><a href="hint.html" target="_blank">Usage Hints</a></p>
                        </div>
                    </div>
                </div>
                <div class="column is-half">
                    <div class="box">
                        <div class="content">
                            <p class="subtitle is-4">Configuration</p>
                            <p class="subtitle is-6">General</p>
                            <p>
                                <input type="checkbox" id="darkmodeId" v-model="configuration.darkmode" />
                                <label for="darkmodeId"> Enable dark mode</label>
                            </p>
                            <p>
                                <input type="checkbox" id="disableFeedbackId" v-model="configuration.disableFeedback" />
                                <label for="disableFeedbackId"> Disable feedback tag</label>
                            </p>
                            <p class="subtitle is-6">Console</p>
                            <p>
                                <input type="checkbox" id="evalSingleLineId" v-model="configuration.evalSingleLine" />
                                <label for="evalSingleLineId"> <span class="tag">Enter</span> evaluates single line input in console</label>
                            </p>
                            <p>
                                <input type="checkbox" id="wrapId" v-model="configuration.wrap" />
                                <label for="wrapId"> Wrap long lines</label>
                            </p>
                            <p>
                                <input type="checkbox" id="lineNumbersId" v-model="configuration.lineNumbers" />
                                <label for="lineNumbersId"> Show line numbers in multiline input</label>
                            </p>
                            <p>
                                <input type="checkbox" id="fixedHeightId" v-model="configuration.fixedHeight" />
                                <label for="fixedHeightId"> Fixed size</label>
                            </p>
                            <p class="subtitle is-6">Editor</p>
                            <p>
                                <input type="checkbox" id="closeBracketsId" v-model="configuration.closeBrackets" />
                                <label for="closeBracketsId"> Close brackets/parentheses/quotes while typing</label>
                            </p>
                            <p>
                                <input type="checkbox" id="editLineNumbersId" v-model="configuration.editLineNumbers" />
                                <label for="editLineNumbersId"> Show line numbers</label>
                            </p>
                            <p class="subtitle is-6">Python</p>
                            <p>
                                <input type="checkbox" id="usePyPIid" v-model="configuration.usePyPI" />
                                <label for="usePyPIid"> Automatically install PyPI packages when used</label>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Feedback :disable="configuration.disableFeedback" :dark="configuration.darkmode" @send="send" />
        </div>
    </section>
</template>

<script setup>

import CodeInput from './CodeInput.vue';
import Console from './Console.vue';
import Controls from './Controls.vue';
import Feedback from './Feedback.vue';

import { computed, ref, watch, onMounted } from 'vue';
import axios from 'axios';
import mitt from 'mitt';

import { configuration, updateBodyDark } from './globals.js';

const script = ref('');

// Event bus for communicating back and forth with Console directly
const eventbus = mitt();

onMounted(() => updateBodyDark());

const optionsCode = computed(() => {
    return {
        type:'python',
        dark:configuration.darkmode,
        lineNumbers:configuration.editLineNumbers,
        closeBrackets:configuration.closeBrackets,
        highlightLine:true,
    };
});

const optionsConsole = computed(() => {
    return {
        evalSingleLine:configuration.evalSingleLine,
        lineNumbers:configuration.lineNumbers,
        closeBrackets:configuration.closeBrackets,
        wrap:configuration.wrap,
        fixedHeight:configuration.fixedHeight,
    };
});

const pyoptionsConsole = computed(() => {
    return {
        usePyPI:configuration.usePyPI,
    };
});

function send(evt) {
    // Fire off post request and ignore any errors at this point
    axios.post('/api/feedback', evt);
}

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
