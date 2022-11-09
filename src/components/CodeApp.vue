//!
//! CodeApp
//!
//! A Vue component representing the top level code panel app.
//!

<template>
    <section :class="{ section:true, dark:darkmode }">
        <div class="container">
            <div class="columns">
                <div class="column is-half">
                    <div class="box">
                        <Controls :buttons="buttons" :dark="darkmode" 
                            @pressed="pressed"
                        />
                        <CodeInput v-model="script" :options="optionsCode" />
                    </div>
                </div>
                <div class="column is-half">
                    <div class="box">
                        <Console :eventbus="eventbus" :options="optionsConsole" :dark="darkmode"
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
                            <p v-if="evalSingleLine" ><span class="tag">Enter</span> evaluate single line input</p>
                            <p v-if="!evalSingleLine" ><span class="tag">Enter</span> insert newline</p>
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
                            <p>
                                <input type="checkbox" id="evalSingleLineId" v-model="evalSingleLine" />
                                <label for="evalSingleLineId"> <span class="tag">Enter</span> evaluates single line input in console</label>
                            </p>
                            <p>
                                <input type="checkbox" id="lineNumbersId" v-model="lineNumbers" />
                                <label for="lineNumbersId"> Show line numbers in multiline input</label>
                            </p>
                            <p>
                                <input type="checkbox" id="closeBracketsId" v-model="closeBrackets" />
                                <label for="closeBracketsId"> Close brackets while typing</label>
                            </p>
                            <p>
                                <input type="checkbox" id="disableFeedbackId" v-model="disableFeedback" />
                                <label for="disableFeedbackId"> Disable feedback tag</label>
                            </p>
                            <p>
                                <input type="checkbox" id="darkmodeId" v-model="darkmode" />
                                <label for="darkmodeId"> Enable dark mode</label>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Feedback :disable="disableFeedback" :dark="darkmode" @send="send" />
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

const script = ref('');

// Event bus for communicating back and forth with Console directly
const eventbus = mitt();

function getLocalStorage(tag, defaultValue) {
    const stored = localStorage.getItem(tag);
    return stored === null ? defaultValue : stored;
}

const evalSingleLine = ref(getLocalStorage('evalSingleLine', 'true') === 'true');
watch(evalSingleLine, (newValue) => {
    localStorage.setItem('evalSingleLine', newValue);
});
const lineNumbers = ref(getLocalStorage('lineNumbers', 'false') === 'true');
watch(lineNumbers, (newValue) => {
    localStorage.setItem('lineNumbers', newValue);
});
const closeBrackets = ref(getLocalStorage('closeBrackets', 'false') === 'true');
watch(closeBrackets, (newValue) => {
    localStorage.setItem('closeBrackets', newValue);
});
const disableFeedback = ref(getLocalStorage('disableFeedback', 'false') === 'true');
watch(disableFeedback, (newValue) => {
    localStorage.setItem('disableFeedback', newValue);
});
const darkmode = ref(getLocalStorage('darkmode', 'false') === 'true');
function updateBodyDark() {
    const html = document.querySelector('html');
    if (darkmode.value) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
}
watch(darkmode, (newValue) => {
    updateBodyDark();
    localStorage.setItem('darkmode', newValue);
});

onMounted(() => updateBodyDark());

const optionsCode = computed(() => {
    return {
        type:'python',
        dark:darkmode.value,
        lineNumbers:lineNumbers.value,
        closeBrackets:closeBrackets.value,
    };
});

const optionsConsole = computed(() => {
    return {
        evalSingleLine:evalSingleLine.value,
        lineNumbers:lineNumbers.value,
        closeBrackets:closeBrackets.value,
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

</script>
