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
//! - eventbus - Eventbus to communicate two ways with this component
//! - options - Setup for input and output, has:
//!     - evalSingleLine - Whether to eval single line input when Enter pressed (or insert newline if false)
//!     - lineNumbers - Show line numbers on multiline input
//!     - closeBrackets - Automatically close brackets/quotes/etc. while typing input
//!     - wrap - Whether to wrap output long lines or not
//!     - fixedHeight - Whether to fix the size (false will shrink/grow vertically between min/max sizes, true will always be max size)
//!     - alternateInput - Use Ctrl-I instead of Ctrl-C
//!     - dark - Render with dark mode
//!     - markStderr - Whether to mark stderr output with styling to distinguish from stdout
//! - pyoptions - Options for python interpreter
//!     - usePyPI - If true imports will automatically look in PyPI and install dependencies, otherwise just Pyodide packages will be loaded as needed
//!     - showArrows - Whether to show arrows before evaluated values
//!
//! Emits:
//! - update:history - When command history is changed this is emitted to inform parent, payload is:
//!    - python - Python command history with { entries[], ...internal... }
//!    - stdin - Command history for stdin entries, with { entries[], ...internal... }
//! - evaluate - When input is evaluated in python, payload is string evaluated
//! - stdin - When stdin is entered, payload is line entered
//! - interrupt - When user interrupts
//! - update:busy - When busy state changes, payload is true/false for new busy state
//! - update:stdin - When stdin state changes, payload is true/false
//! - update:loading - When loading state changes, payload is true/false
//!
//! Eventbus accepts:
//! - evaluate - Payload has { src }
//! - interrupt
//! - clear
//! - reset

<template>
    <div class="consoleappholder">
        <div :class="{ consoleoutputholder:true, fixedheight:options.fixedHeight, markStderr:options.markStderr }" ref="holder">
            <ConsoleOutput :values="outputs" :wrap="options.wrap" />
            <div class="busyiconholder">
                <span class="material-icons spin" v-if="busy">autorenew</span>
            </div>
            <div class="inputiconholder">
                <span class="material-icons pulse" v-if="waitingInput">pending</span>
            </div>
            <div class="consoleinputholder" ref="consoleinputholder">
                <ConsoleInput v-model="entry" :options="inputOptions" :eventbus="consoleInputEventbus"
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
/* Set basic fg/bg in light and dark modes */
div.consoleappholder {
    background-color: transparent;
}
div.consoleappholder pre {
    color: var(--console-fg);
}
div.consoleoutputholder {
    min-height: 60px;
    max-height: calc(100vh - 200px);
    overflow: auto;
}
div.consoleoutputholder.fixedheight {
    min-height: calc(100vh - 200px);
}
div.consoleinputholder {
    margin-top: -43px;
    margin-left: 35px;
}

/* Set icon positions and animations */
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
	0% { opacity: 1.0; }
	50% { opacity: 0; }
	100% { opacity: 1.0; }
}
.pulse {
  animation-name: pulse;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

/* Set output backgrounds */
div.dataoutput pre {
    background-color: transparent;
}
div.consoleoutputholder.markStderr div.dataoutput pre.stderr {
    color: var(--stderr-fg);
    background-color: var(--stderr-bg);
    border-left: solid 5px var(--stderr-border);
}
[data-theme="dark"] div.consoleoutputholder.markStderr div.dataoutput pre.stderr {
    color: var(--stderr-fg);
    background-color: var(--stderr-bg);
    border-left: solid 5px var(--stderr-border);
}
</style>

<script setup>

import ConsoleInput from './ConsoleInput.vue';
import ConsoleOutput from './ConsoleOutput.vue';

import { computed, reactive, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import mitt from 'mitt';
import { strlen } from 'printable-characters';

import { newPythonKernel } from '../python.js';
import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt,
         setIOComplete,
         inputPut,
         isInputWaiting,
         setFileUploadData } from '../signal.js';

const props = defineProps([ 'eventbus', 'options', 'pyoptions' ]);
const emit = defineEmits([ 'update:history', 'evaluate', 'stdin', 'interrupt', 'update:busy', 'update:stdin', 'update:loading' ]);

const consoleInputEventbus = mitt(); // bus for ConsoleInput
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
    } else if (out.name !== 'stdout' && out.name !== 'stderr') {
        outputs.push(out);
    }else if (outputs[outputs.length - 1].name === out.name && outputs[outputs.length - 1]['text/plain'].length < MAX_LENGTH) {
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

const busy = computed(() => (status.value==='Working' || status.value==='Initializing') && !waitingInput.value);
const loading = computed(() => (status.value==='Initializing'));

watch(busy, (newValue) => {
    emit('update:busy', newValue);
});

watch(waitingInput, (newValue) => {
    emit('update:stdin', newValue);
});

watch(loading, (newValue) => {
    emit('update:loading', newValue);
});

onMounted(() => {
    emit('update:busy', busy.value);
    emit('update:stdin', waitingInput.value);
    emit('update:loading', loading.value);
});

onMounted(() => {
    addOutput({
        name: 'stdout',
        'text/plain': 'Loading Python...\n',
    });
});

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
        alternateInterrupt: options.alternateInterrupt,
        dark: options.dark,
    };
});

const INPUT_INDENT_PERCHAR = 8.5;
const MIN_MARGIN_LEFT = 0;
const MIN_MARGIN_LEFT_BUSY = 35;
const MAX_MARGIN_LEFT = 400;
const ORIGINAL_MARGIN_TOP = -40;
const ONE_LINE = 20;

//! Compute horizontal offset of last line of outputs, also avoid busy icon
watch([outputs, busy], ([newOutputs, newBusy]) => {
    if (newOutputs.length === 0) {
        return 0;
    }
    const last = newOutputs[newOutputs.length - 1];
    if (last['text/plain'] === undefined || last.download) {
        // If the last part of output is not normal plain text, give up computing horizontal offset
        return 0;
    }
    const split = last['text/plain'].split('\n');
    const len = strlen(split[split.length - 1]);
    let top = ORIGINAL_MARGIN_TOP;

    let newMarginLeft = len * INPUT_INDENT_PERCHAR;
    if (newMarginLeft > MAX_MARGIN_LEFT) {
        // If input is far right, then start new input on left side of next line
        newMarginLeft = MIN_MARGIN_LEFT;
        top += ONE_LINE;
    }
    // Avoid busy
    if (newBusy && newMarginLeft < MIN_MARGIN_LEFT_BUSY ) {
        newMarginLeft = MIN_MARGIN_LEFT_BUSY;
    }
    newMarginLeft = newMarginLeft < MIN_MARGIN_LEFT ? MIN_MARGIN_LEFT : (newMarginLeft > MAX_MARGIN_LEFT ? MAX_MARGIN_LEFT : newMarginLeft);
    consoleinputholder.value.style['margin-top'] = top + 'px';
    consoleinputholder.value.style['margin-left'] = newMarginLeft + 'px';
});

function clickOutput(evt) {
    // Focus input area
    consoleInputEventbus.emit('focus');
}

const normalstate = 'state';
const prompt = ansi_normal + '>>> ';
const prompt_multiline = '... ';
let python_version = '';

const python_opts = {
    onReady: function (version) {
        python_version = version;
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
//! Used to echo multiline input
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
        nextTick(() => {
            holder.value.scroll(0, holder.value.scrollHeight);
            consoleInputEventbus.emit('selectend');
        });
    }
}

function historyNext() {
    const mode = waitingInput.value ? 'stdin' : 'python';
    if (history[mode].position < history[mode].entries.length) {
        history[mode].position++;
        if (history[mode].position === history[mode].entries.length) {
            entry.value = history[mode].savedCurrent;
            nextTick(() => {
                holder.value.scroll(0, holder.value.scrollHeight);
                consoleInputEventbus.emit('selectend');
            });
        } else {
            entry.value = history[mode].entries[history[mode].position];
            nextTick(() => {
                holder.value.scroll(0, holder.value.scrollHeight);
                consoleInputEventbus.emit('selectend');
            });
        }
    }
}

function historyRegister(entry) {
    const mode = waitingInput.value ? 'stdin' : 'python';
    const last = history[mode].entries.length > 0 ? history[mode].entries[history[mode].entries.length - 1] : null;
    if (entry === last) {
        // Ignore same entry multiple times in a row
        history[mode].position = history[mode].entries.length;
    } else {
        history[mode].entries.push(entry);
        history[mode].position = history[mode].entries.length;
        emit('update:history', history);
    }
}

function evaluate(src, console) {
    clearInterrupt();
    status.value = 'Working';
    if (console) {
        // Register command history on console
        historyRegister(src);
        // Console echoes input (with fancy indent, in bold)
        addOutput({
            name: 'stdout',
            'text/plain': ansi_bold + fancy_indent(src, '', prompt_multiline) + ansi_normal + '\n',
        });
    }
    emit('evaluate', src);
    let options = {
        usePyPI:props.pyoptions.usePyPI,
        showArrows:props.pyoptions.showArrows,
    };
    if (!console) {
        // For code evaluation, do not print "-> 4" for "2+2", only output for explicit prints.
        options.no_default_func = true;
    }
    python.evaluate(src, normalstate, options, {
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
        onDownload: function(msg, filename) {
            let item = {};
            item.data = msg;
            item.filename = filename;
            item.download = true;
            addOutput(item);
        },
        onUpload: function(filename) {
            let item = {};
            item.filename = filename;
            item.upload = true;
            item.handler = function(data) {
                setFileUploadData(data);
                setIOComplete();
                // JavaScript will get the io complete signal and read the file upload data area
            }
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
    evaluate(src, /*console=*/true);
}

//! Trigger interrupt in python worker
function interrupt() {
    if (status.value === 'Initializing') {
        // Don't interrupt if we are still loading
        return;
    }
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

// Respond to direct eventbus requests from parent

props.eventbus.on('evaluate', (evt) => {
    // Clear outputs and reset with no version info or prompt at start (except newline to avoid out of bounds busy)
    outputs.splice(0);
    python.deletestate(normalstate, {
        onResponse: function() {
            python.freshstate(normalstate, {
                onResponse: function() {
                    status.value = 'Ready';
                    addOutput({
                        name: 'stdout',
                        'text/plain': '\n',
                    });
                    evaluate(evt.src, /*console=*/false);
                },
            });
        } 
    });
});

props.eventbus.on('interrupt', () => {
    interrupt();
});

props.eventbus.on('clear', () => {
    clear();
});

props.eventbus.on('reset', () => {
    reset();
});

props.eventbus.on('update:input', (text) => {
    entry.value = text;
    nextTick(() => {
        // Wait for the value to propagate to codemirror entirely
        // (Otherwise it will truncate selecting end of input)
        consoleInputEventbus.emit('focus');
        consoleInputEventbus.emit('selectend');
    });
});

</script>
