//!
//! Cell
//!
//! This is a Vue component representing one cell in a notebook.
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

<template>
    <div class="cell" :class="classObject()" v-on:click.stop="handleClick" v-if="!hidden">
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
                    @update:modelValue="newValue => { modelValue = newValue; $emit('update:modelValue', newValue); }"
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
            />
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

import { ref } from 'vue';
import { marked } from 'marked';
import CellOutput from './CellOutput.vue';
import CellInput from './CellInput.vue';
import CheckPoint from './CheckPoint.vue';

const props = defineProps(['modelValue', 'output', 'id', 'type', 'subtype', 'selected', 'state', 'command', 'hidden', 'readonly', 'submit']);

const emit = defineEmits(['update:modelValue', 'action', 'click', 'submit']);

// This ref holds the CellInput instance for focus/blur
const cellinput = ref(null);

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
            'text/html': marked(props.modelValue),
        } ];
    }
}

function leftClass () {
    return {
        working: this.state === 'working',
        evaluated: this.state === 'evaluated',
    }
}

function rightClass () {
    return {
        python: this.type === 'python',
        markdown: this.type === 'markdown',
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

</script>
