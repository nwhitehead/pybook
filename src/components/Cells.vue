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
//! - allowDrag - True if cells can be dragged to reorder
//!
//! Events:
//! - update:modelValue - Emitted when modelValue changes, payload is values array (this is for reordering cells by dragging usually)
//! - update:modelCellValue - Emitted when single cell modelValue changes, payload is {id, value}
//!

<template>
    <draggable
        v-if="allowDrag"
        v-model="modelValue"
        handle=".handle"
        class="cells"
        item-key="id"
        @update:modelValue="newValue => { $emit('update:modelValue', newValue); }"
        @update:modelCellValue="newValue => { $emit('update:modelCellValue', newValue); }"
    >
        <template #item="{element}">
            <Cell
                :modelValue="computeModelValue(element)"
                :output="element.outputs"
                :id="''+element.id"
                :type="computeType(element)"
                :subtype="computeSubtype(element)"
                :selected="isSelected(element.id)"
                :state="element.state"
                :command="isSelected(element.id) && command"
                :hidden="isHidden(element)"
                :readonly="isReadOnly(element)"
                :submit="isSubmit(element)"
                :allowInput="isSelected(element.id)"
                @update:modelValue="newValue => { $emit('update:modelCellValue', { id:element.id, value:newValue }); }"
                @action="handleAction"
                @click="handleClick"
                @submit="handleSubmit"
            />
        </template>
    </draggable>
    <Cell
        v-else
        v-for="element in modelValue"
        :modelValue="computeModelValue(element)"
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
        :allowInput="true"
        @update:modelValue="newValue => { $emit('update:modelCellValue', { id:element.id, value:newValue }); }"
        @action="handleAction"
        @click="handleClick"
        @submit="handleSubmit"
    />
</template>

<script setup>

import { computed } from 'vue';
import draggable from 'vuedraggable';
import Cell from './Cell.vue';

const props = defineProps([ 'modelValue', 'select', 'command', 'allowDrag' ]);
const emit = defineEmits([ 'update:modelValue', 'update:modelCellValue', 'action', 'click', 'submit' ]);

function computeModelValue (content) {
    // Submit type cells have two edit areas, the "source" area that will be evaluated when the submit button is clicked,
    // and the "user" area that the user fills out. The source presumably looks at the content of the user area to do things.
    // Users can edit both areas by flipping 'edit'/'view' subtype for the submit.
    if (content.cell_type === 'submit' && content.subtype === 'edit') return content.source;
    if (content.cell_type === 'submit') return content.user; // In case subtype is not declared default to "view"
    // Everything else (non-submit) is just source
    return content.source;
}

function computeType (content) {
    if (content.cell_type === 'code' && content.language === 'python') return 'python';
    if (content.cell_type === 'code') return 'python'; // No language code cells are python
    if (content.cell_type === 'markdown') return 'markdown';
    if (content.cell_type === 'checkpoint') return 'checkpoint';
    if (content.cell_type === 'submit' && content.subtype === 'edit') return 'python';
    if (content.cell_type === 'submit' && content.subtype === 'view' && content.language === 'python') return 'python';
    if (content.cell_type === 'submit' && content.subtype === 'view' && content.language === 'text') return 'text';
    if (content.cell_type === 'submit' && content.subtype === 'view') return 'python'; // Assume submit areas for user are python by default
    if (content.cell_type === 'submit') return 'python';
    throw "Illegal content type";
}

function computeSubtype (content) {
    if (content.cell_type === 'code') return '';
    if (content.cell_type === 'markdown' && content.subtype === 'view') return 'view';
    if (content.cell_type === 'markdown' && content.subtype === 'edit') return 'edit';
    if (content.cell_type === 'markdown') return 'view';
    if (content.cell_type === 'checkpoint' && content.subtype === 'save') return 'save';
    if (content.cell_type === 'checkpoint' && content.subtype === 'use') return 'use';
    if (content.cell_type === 'submit' && content.subtype === 'view') return 'view';
    if (content.cell_type === 'submit' && content.subtype === 'edit') return 'edit';
    if (content.cell_type === 'submit') return 'view';
    throw "Illegal content subtype";
}

function isSelected (id) {
    return '' + id === '' + props.select;
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
    return content.cell_type === 'submit';
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

</script>
