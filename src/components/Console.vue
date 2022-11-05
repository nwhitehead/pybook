//!
//! Console
//!
//! A Vue component representing a Python console.
//!
//! The console is reponsible for handling Python interpreter, input, busy state.
//! User of console can set options. There is also an eventbus prop that allows
//! direct two way communication to this component.
//!
//! Props:
//! - eventbus - Eventbus to communicate two ways with this component (currently unused, designed for controlling Python interpreter in future)
//! - options - Setup for input, has:
//!     - evalSingleLine - Whether to eval single line input when Enter pressed (or insert newline if false)
//!     - lineNumbers - Show line numbers on multiline input
//!     - closeBrackets - Automatically close brackets/quotes/etc. while typing input
//!
//! Emits:
//! - update:history - When command history is changed this is emitted to inform parent, payload is:
//!    - python - Python command history with { entries[], ...internal... }
//!    - stdin - Command history for stdin entries, with { entries[], ...internal... }
//! - evaluate - When input is evaluated in python, payload is string evaluated
//! - stdin - When stdin is entered, payload is line entered
//! - interrupt - When user interrupts
//! - update:busy - When busy state changes, payload is true/false for new busy state
//! - update:stdin - When stdin state changes, paylaod is true/false
//!

<template>
    <div class="consoleappholder">
        <div class="consoleoutputholder" ref="holder">
            <ConsoleOutput :values="outputs" />
            <div class="busyiconholder">
                <span class="material-icons spin" v-if="(status==='Working' || status==='Initializing') && !waitingInput">autorenew</span>
            </div>
            <div class="inputiconholder">
                <span class="material-icons pulse" v-if="waitingInput">pending</span>
            </div>
            <div class="consoleinputholder" ref="consoleinputholder">
                <ConsoleInput v-model="entry" :options="inputOptions"
                    @evaluate="clickEvaluate()"
                    @interrupt="interrupt()"
                    @clear="clear()"
                    @historyPrevious="historyPrevious()"
                    @historyNext="historyNext()"
                    @reset="reset()"
                />
            </div>
        </div>
    </div>
</template>

<style>
div.consoleappholder {
    background-color: #eee;
}
div.consoleoutputholder {
    min-height: 60px;
    max-height: calc(100vh - 130px);
    overflow: auto;
}
div.consoleinputholder {
    margin-top: -43px;
    margin-left: 35px;
}
div.busyiconholder {
    position: relative;
    width: 0;
    height: 0;
    left: 10px;
    top: -20px;
}
div.inputiconholder {
    position: relative;
    height: 0;
    top: -20px;
    float: right;
}
@keyframes spin {
    from { transform:rotate(0deg); }
    to { transform:rotate(360deg); }
}
.spin {
  animation-name: spin;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
@keyframes pulse {
	0% { color: #00000080; }
	50% { color: #88888800; }
	100% { color: #00000080; }
}
.pulse {
  animation-name: pulse;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
</style>

<script setup>

import ConsoleInput from './ConsoleInput.vue';
import ConsoleOutput from './ConsoleOutput.vue';

import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';

import { newPythonKernel } from '../python.js';
import { signalMap,
                 isBusy,
                 isStarting, setStarting,
                 setInterrupt, clearInterrupt,
                 inputPut,
                 isInputWaiting
             } from '../signal.js';

const props = defineProps([ 'eventbus', 'options' ]);
const emit = defineEmits([ 'update:history', 'evaluate', 'interrupt', 'update:busy', 'update:stdin' ]);

const holder = ref(null);
const consoleinputholder = ref(null);

let entry = ref('');
let outputs = reactive([]);
let status = ref('Initializing');

const MAX_LENGTH = 4096;

const ansi_bold = '\x1b[1m';
const ansi_normal = '\x1b[0m';

function addOutput (out) {
  if (outputs.length === 0) {
    outputs.push(out);
  } else if (outputs[outputs.length - 1].name === out.name && outputs[outputs.length - 1]['text/plain'].length < MAX_LENGTH) {
    outputs[outputs.length - 1]['text/plain'] += out['text/plain'];
  } else {
    outputs.push(out);
  }
  nextTick(() => holder.value.scroll(0, holder.value.scrollHeight));
}

// Time is used to trigger watcher on SharedArrayBuffer for waiting for stdin (Vue doesn't know when value changes there)
let timer = null;
// Vue reactive variable keeping track of whether we are waiting for stdin
let waitingInput = ref(false);
// Time interval to check for waiting on stdin
const STDIN_CHECK_INTERVAL = 100;

onMounted(() => {
    timer = setInterval(() => {
        waitingInput.value = isInputWaiting();
    }, STDIN_CHECK_INTERVAL);
});

onBeforeUnmount(() => {
    clearInterval(timer);
});

onMounted(() => {
    addOutput({
        name: 'stdout',
        'text/plain': 'Loading Python...\n',
    });
});

function getLocalStorage(tag, defaultValue) {
    const stored = localStorage.getItem(tag);
    return stored === null ? defaultValue : stored;
}

const inputOptions = computed(() => {
    const numLines = entry.value.split('\n').length;
    const options = props.options ? props.options : {};
    return {
        type: waitingInput.value ? undefined : 'python',
        ready: status.value === 'Ready',
        // Always set evalSingleLine if it is stdin input, otherwise use user setting
        evalSingleLine: waitingInput.value ? true : options.evalSingleLine,
        singleLine: waitingInput.value ? true : false,
        lineNumbers: waitingInput.value ? false : (numLines > 1 ? options.lineNumbers : false),
        closeBrackets: waitingInput.value ? false : options.closeBrackets,
    };
});

//! Compute horizontal offset of last line of outputs
const horizontalOffset = computed(() => {
    if (outputs.length === 0) {
        return 0;
    }
    const last = outputs[outputs.length - 1];
    if (last['text/plain'] === undefined) {
        // If the last part of output is not plain text, give up computing horizontal offset
        return 0;
    }
    const split = last['text/plain'].split('\n');
    return split[split.length - 1].length;
});

const INPUT_INDENT_PERCHAR = 8.5;
const MIN_MARGIN_LEFT = 35; // Keeps cursor from overlapping busy icon on left
const MAX_MARGIN_LEFT = 400;
const ORIGINAL_MARGIN_TOP = -43;
const ONE_LINE = 20;

watch(horizontalOffset, (newValue, oldValue) => {
    let newMarginLeft = newValue * INPUT_INDENT_PERCHAR;
    if (newMarginLeft > MAX_MARGIN_LEFT) {
        // If input is far right, then start new input on left side of next line
        newMarginLeft = MIN_MARGIN_LEFT;
        consoleinputholder.value.style['margin-top'] = ORIGINAL_MARGIN_TOP + ONE_LINE + 'px';
    } else {
        consoleinputholder.value.style['margin-top'] = ORIGINAL_MARGIN_TOP + 'px';
    }
    newMarginLeft = newMarginLeft < MIN_MARGIN_LEFT ? MIN_MARGIN_LEFT : (newMarginLeft > MAX_MARGIN_LEFT ? MAX_MARGIN_LEFT : newMarginLeft);
    consoleinputholder.value.style['margin-left'] = newMarginLeft + 'px';
});

const normalstate = 'state';
const prompt = '>>> ';
let python_version = '';

const python_opts = {
    onReady: function (version) {
        python_version = '🐍 Python ' + version;
        status.value = 'Ready';
        console.log(version);
        addOutput({
            name: 'stdout',
            'text/plain': python_version + '\n' + prompt,
        });
        python.freshstate(normalstate, {
            onResponse: function() {
            },
        });
    },
};

const python = newPythonKernel(python_opts);

//! Take a multiline string and indent it with a prefix on first line, different prefix on subsequent lines
function fancy_indent(txt, first_prefix, prefix) {
    const lines = txt.split('\n');
    let result = [];
    let current_prefix = first_prefix;
    for (let i = 0; i < lines.length; i++) {
        result.push(current_prefix + lines[i]);
        current_prefix = prefix;
    }
    return result.join('\n');
}

// Keep track of history
// History variables are split for python and stdin (separate histories)
// savedCurrent is current new entry (not yet evaluated) in case we went to history then go back to current edit
let history = {
    'python': {
        entries: [],
        position: 0,
        savedCurrent: '',
    },
    'stdin': {
        entries: [],
        position: 0,
        savedCurrent: '',
    },
};

function historyPrevious() {
    const mode = waitingInput.value ? 'stdin' : 'python';
    if (history[mode].position > 0 && history[mode].entries.length > 0) {
        if (history[mode].position === history[mode].entries.length) {
            // save current entry
            history[mode].savedCurrent = entry.value;
        }
        history[mode].position--;
        entry.value = history[mode].entries[history[mode].position];
        nextTick(() => holder.value.scroll(0, holder.value.scrollHeight));
    }
}

function historyNext() {
    const mode = waitingInput.value ? 'stdin' : 'python';
    if (history[mode].position < history[mode].entries.length) {
        history[mode].position++;
        if (history[mode].position === history[mode].entries.length) {
            entry.value = history[mode].savedCurrent;
            nextTick(() => holder.value.scroll(0, holder.value.scrollHeight));
        } else {
            entry.value = history[mode].entries[history[mode].position];
            nextTick(() => holder.value.scroll(0, holder.value.scrollHeight));
        }
    }
}

function historyRegister(entry) {
    const mode = waitingInput.value ? 'stdin' : 'python';
    history[mode].entries.push(entry);
    history[mode].position = history[mode].entries.length;
    emit('update:history', history);
}

function clickEvaluate() {
    const src = entry.value;
    entry.value = '';
    clearInterrupt();
    if (isInputWaiting()) {
        // Convert string from CodeMirror into byte array
        // Use UTF-8 since CodeMirror might have advanced unicode characters
        const utf8Encoder = new TextEncoder();
        const bytes = utf8Encoder.encode(src);
        // Send bytes one by one using inputPut
        // Receiver will handle flipping isInputWaiting flag as appropriate
        for (let i = 0; i < bytes.length; i++) {
            inputPut(bytes[i]);
        }
        // Empty input needs to be distinguished from EOF (like pressing Ctrl-D)
        if (bytes.length === 0) {
            inputPut(10);
        }
        inputPut(0);
        historyRegister(src);
        addOutput({
            name: 'stdout',
            'text/plain': ansi_bold + src + ansi_normal + '\n',
        });
        emit('stdin', src);
        return;
    }
    if (status.value === 'Initializing' || status.value === 'Working') {
        entry.value = src;
        // Don't register any history, not submitted
        return;
    }
    status.value = 'Working';
    historyRegister(src);
    addOutput({
        name: 'stdout',
        'text/plain': ansi_bold + fancy_indent(src, '', '... ') + ansi_normal + '\n',
    });
    emit('evaluate', src);
    python.evaluate(src, normalstate, {
        onStdout: function (msg) {
            addOutput({
                name: 'stdout',
                'text/plain': msg,
            });
        },
        onStderr: function (msg) {
            addOutput({
                name: 'stderr',
                'text/plain': msg,
            });
        },
        onOutput: function(content_type, msg) {
            let item = {};
            item[content_type] = msg;
            addOutput(item);
        },
        onResponse: function () {
            addOutput({
                name: 'stdout',
                'text/plain': prompt,
            });
            status.value = 'Ready';
        }
    });
}

//! Trigger interrupt in python worker
function interrupt() {
    status.value = 'Interrupt';
    setInterrupt();
    emit('interrupt');
}

//! Clear all output
function clear() {
    // Clear all outputs
    outputs.splice(0);
    addOutput({
        name: 'stdout',
        'text/plain': prompt,
    });
}

//! Reset interpreter state
function reset() {
    // First clear all outputs
    outputs.splice(0);
    python.deletestate(normalstate, {
        onResponse: function() {
            python.freshstate(normalstate, {
                onResponse: function() {
                    status.value = 'Ready';
                    addOutput({
                        name: 'stdout',
                        'text/plain': python_version + '\n' + prompt,
                    });
                },
            });
        } 
    });
}

</script>
