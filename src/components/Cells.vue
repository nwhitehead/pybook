//!
//! Cells
//!
//! Cells is a Vue component representing a stack of cells on a page.
//!
//! Props:
//! - modelValue - Array of cell data. Each element has:
//!    - source - Source text
//!    - outputs - Array of output data (in CellOutput/DataOutput format)
//!    - id - Unique identifier for cell
//!    - cell_type - Either "code", "markdown", or "checkpoint"
//!    - subtype - For cell_type "markdown" can be "edit" or "view", for "checkpoint" can be "save" or "use"
//!    - language - For cell_type "code" right now always "python", future expansion would be other languages e.g. "javascript"
//!    - state - Evaluation state, either "working", "evaluated", or undefined
//!    - readonly - True if cell is readonly
//!    - hidden - True if cell should be entirely hidden
//!    - submit - True if cell should have submit button
//! - select - Id of cell to show as selected
//! - command - True if edit mode is in "command" mode (as opposed to edit mode)
//!

<template>
    <draggable
        v-model="modelValue"
        class="cells"
        item-key="id"
        @update:modelValue="newValue => { modelValue = newValue; $emit('update:modelValue', newValue); }"
    >
        <template #item="{element}">
            <Cell
                :modelValue="element.source"
                :output="element.outputs"
                :id="element.id"
                :type="computeType(element)"
                :subtype="computeSubtype(element)"
                :selected="isSelected(element.id)"
                :state="element.state"
                :command="isSelected(element.id) && command"
                :hidden="isHidden(element)"
                :readonly="isReadOnly(element)"
                :submit="isSubmit(element)"
                @update:modelValue="newValue => { updateIdSource(element.id, newValue); }"
                @action="handleAction"
                @click="handleClick"
                @submit="handleSubmit"
            />
        </template>
    </draggable>
</template>

<script setup>

import { computed } from 'vue';
import draggable from 'vuedraggable';
import Cell from './Cell.vue';

const props = defineProps([ 'modelValue', 'select', 'command' ]);
const emit = defineEmits(['update:modelValue', 'action', 'click', 'submit']);

function computeType (content) {
    if (content.cell_type === 'code' && content.language === 'python') return 'python';
    if (content.cell_type === 'markdown') return 'markdown';
    if (content.cell_type === 'checkpoint') return 'checkpoint';
    throw "Illegal content type";
}

function computeSubtype (content) {
    if (content.cell_type === 'code') return '';
    if (content.cell_type === 'markdown' && content.subtype === 'view') return 'view';
    if (content.cell_type === 'markdown' && content.subtype === 'edit') return 'edit';
    if (content.cell_type === 'checkpoint' && content.subtype === 'save') return 'save';
    if (content.cell_type === 'checkpoint' && content.subtype === 'use') return 'use';
    throw "Illegal content subtype";
}
function isSelected (index) {
    return index === props.select;
}

function isHidden (content) {
    // Any type of cell can be hidden
    if (content.hidden === true) {
        return true;
    }
    return false;
}

function isReadOnly (content) {
    if (content.readonly === true) {
        return true;
    }
    return false;
}

function isSubmit (content) {
    // Only code cells can have "submit" button
    if (content.cell_type === 'code' && content.submit === true) {
        return true;
    }
    return false;
}

function updateIdSource(id, newValue) {
    //! Update the modelValue for a specific id (input source changed for a cell)
    for (let i = 0; i < props.modelValue.length; i++) {
        if (props.modelValue[i].id === id) {
            props.modelValue[i].source = newValue;
            emit('update:modelValue', props.modelValue);
            return;
        }
    }
    throw "Could not find cell id to update";
}

function handleInput (event) {
    emit('update:modelValue', event);
}

function handleAction (event) {
    emit('action', event);
}

function handleClick (event) {
    emit('click', event);
}

function handleSubmit (event) {
    emit('submit', event);
}

function focus (n) {
    //return this.$refs.cell[n].focus();
}

function blur (n) {
    //return this.$refs.cell[n].blur();
}

function blurAll () {
    // Check that this.values is defined
    // It can be undefined when all pages are deleted before fresh empty page is added
    if (this.values !== undefined) {
        for (let i = 0; i < this.values.length; i++) {
            this.blur(i);
        }
    }
    return true;
}

</script>
