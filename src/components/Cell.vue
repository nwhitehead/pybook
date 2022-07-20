//!
//! Cell
//!
//! This is a Vue component representing one cell in a notebook.
//!
//! This component is also responsible for handling blocking stdin input from Python. Input is always
//! done at the end of all output with a button and CellInput area to edit text. Only shown when
//! python is blocking on stdin input.
//!
//! Props:
//! - modelValue - Input value for this cell, in CellInput format
//! - output - Output value for this cell, in CellOutput format
//! - id - Unique identifier to keep track of this cell
//! - type - 'python', 'markdown', or 'checkpoint'
//! - subtype - For type 'markdown', either 'edit' or 'show'
//!             For type 'checkpoint', either 'save' or 'use'
//! - selected - true when this cell should be drawn selected
//! - state - Evaluation state, either "working", "evaluated", or undefined
//! - command - true to draw cell as in command mode
//! - hidden - true if cell is hidden and should not be shown
//! - readonly - true if cell is readonly and cannot be edited
//! - submit - true if cell should include a "Submit" button
//! - allowInput - true if cell should allow dynamic stdin input
//!
//! Events:
//! - update:modelValue - Emitted when modelValue changes, payload is value
//! - action - Emitted when an action is requested (such as with keyboard shortcut or mouse UI, e.g. insert new cell)
//!     Payload is { id, action }
//! - click - Emitted when cell is clicked (usual response would be to select this cell, focus input)
//!     Payload is { id }
//! - submit - Emitted when submit button is pressed (if present)
//!     Payload is { id }
//!
//! Uses "mousedown" for handling mouse clicks to stay in sync with text cursor moves in codemirror
//! (Otherwise cursor moves on button down, selection moves on button up)
//!

<template>
    <div class="cell" :class="classObject()" @mousedown.stop="handleClick" v-if="!hidden">
        <div class="side-left handle" :class="leftClass()">
        </div>
        <div class="side-right" :class="rightClass()">
            <div :class="readonlyClass()" v-if="showEdit()">
                <CellInput
                    v-model="modelValue"
                    :id="id"
                    :options="cellInputOptions()"
                    @action="handleAction()"
                    ref="cellinput"
                    @update:modelValue="newValue => { $emit('update:modelValue', newValue); }"
                />
            </div>
            <CheckPoint
                :value="modelValue"
                :type="subtype"
                v-if="showCheckpoint()"
            />
            <button class="button is-primary" v-if="submit" @click.stop="handleSubmit()">
                Submit
            </button>
            <CellOutput
                :values="filteredOutput()"
                v-if="showResults()"
                ref="celloutput"
            />
            <div v-if="showStdinInput && allowInput" @keyup.enter.exact="handleStdinInputClick">
                <CellInput v-model="textStdinInput" :options="{ singleLine: true }" />
                <button @click="handleStdinInputClick">Input</button>
            </div>
        </div>
    </div>
</template>

<style>
.cell {
    position: relative;
    border: 1px solid transparent;
    border-left-width: 5px;
    margin: 15px;
    padding: 10px;
    display: flex;
}
.cell.selected {
    border: 1px solid #00f;
    border-left-width: 5px;
}
.cell.command {
    background: #ddd;
    border: 1px solid #080;
    border-left-width: 5px;
    border-right-width: 5px;
}
.readonly-inner {
    border: 15px solid;
    border-image: repeating-linear-gradient(44deg, #888,#888 7px,#ff0 7px, #ff0 15px, #888 15px) 0 15 0 0;
    border-width: 0px 15px 0px 0px;
}
.side-left.working {
    background: #edf;
}
.side-left.evaluated {
    background: #0a0;
}

div .side-left {
    min-height: 40px;
    flex: 0 0 40px;
}
div .side-right {
    flex: 1 1 auto;
    overflow: hidden;
}
</style>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue';
import { marked } from 'marked';
import CellOutput from './CellOutput.vue';
import CellInput from './CellInput.vue';
import CheckPoint from './CheckPoint.vue';
import DOMPurify from 'dompurify';

import { isInputWaiting, inputPut } from '../signal.js';

const props = defineProps(['modelValue', 'output', 'id', 'type', 'subtype', 'selected', 'state', 'command', 'hidden', 'readonly', 'submit', 'allowInput']);

const emit = defineEmits(['update:modelValue', 'action', 'click', 'submit']);

// This ref holds the CellInput instance for focus/blur
const cellinput = ref(null);
const celloutput = ref(null);

// Time is used to trigger watcher on SharedArrayBuffer (Vue doesn't know when value changes)
let timer = null;
// Text currently entered for stdin input in editor
let textStdinInput = ref('');
// Whether to show stdin input area
let showStdinInput = ref(false);

function cellInputOptions () {
    return { type:props.type, readonly:props.readonly };
}

function showEdit () {
    return props.type === undefined || props.type === 'python' || (props.type === 'markdown' && props.subtype === 'edit');
}

function showResults () {
    return props.type === 'python' || props.type === 'markdown';
}

function showCheckpoint () {
    return props.type === 'checkpoint';
}

function readonlyClass () {
    return {
        'readonly-inner': props.readonly,
    };
}

function classObject () {
    return {
        selected: props.selected,
        command: props.command,
        working: props.state === 'working',
        evaluated: props.state === 'evaluated',
        readonly: props.readonly,
    }
}

function filteredOutput () {
    if (props.type === 'python') {
        return props.output;
    }
    if (props.type === 'markdown') {
        return [ {
            'text/html': DOMPurify.sanitize(marked(props.modelValue)),
        } ];
    }
}

function leftClass () {
    return {
        working: props.state === 'working',
        evaluated: props.state === 'evaluated',
    }
}

function rightClass () {
    return {
        python: props.type === 'python',
        markdown: props.type === 'markdown',
    }
}

function handleAction (event) {
    emit('action', { id:props.id, action:event.action });
}

function handleClick (event) {
    emit('click', { id:props.id });
}

function handleSubmit (event) {
    emit('submit', { id:props.id });
}

onMounted(() => {
    timer = setInterval(() => {
        showStdinInput.value = isInputWaiting();
    }, 500);
});

onBeforeUnmount(() => {
    clearInterval(timer);
});

function handleStdinInputClick () {
    // Convert string from CodeMirror into byte array
    // Use UTF-8 since CodeMirror might have advanced unicode characters
    const utf8Encoder = new TextEncoder();
    const bytes = utf8Encoder.encode(textStdinInput.value);
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
    // Clear text editor buffer
    textStdinInput.value = '';
}

</script>
