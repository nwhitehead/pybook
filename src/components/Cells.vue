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
//!    - metadata - Can have:
//!        - sub_type - For cell_type "markdown" can be "edit" or "view", for "checkpoint" can be "save" or "use"
//!        - language - For cell_type "code" right now always "python", future expansion other languages
//!        - state - Evaluation state, either "working", "evaluated", or undefined
//!        - readonly - True if cell is readonly
//!        - hidden - True if cell should be entirely hidden
//!        - submit - True if cell should have submit button
//! - select - Id of cell to show as selected
//! - command - True if edit mode is in "command" mode (as opposed to edit mode)
//!

<template>
    <draggable
        v-model="modelValue"
        class="cells"
        @start="dragStart"
        @end="dragEnd"
        item-key="id"
    >
        <template #item="{element}">
            <Cell
                :modelValue="element.source"
                :output="element.outputs"
                :hidden="false"
                :id="element.id"
                :selected="isSelected(element.id)"
                :command="false"
                :type="'python'"
                @update:modelValue="newValue => { updateIdSource(element.id, newValue); }"
            />
        </template>
    </draggable>
</template>

<script setup>

            // <!-- <cell
            //     :value="element.source"
            //     :output="element.outputs"
            //     :id="element.id"
            //     :selected="isSelected(element.id)"
            //     :command="isSelected(element.id) && command"
            //     :type="computeType(element)"
            //     :subtype="computeSubtype(element)"
            //     :state="element.state"
            //     :hidden="false/*isHidden(element)*/"
            //     :readonly="isReadOnly(element)"
            //     :submit="isSubmit(element)"
            //     @update:value="handleInput"
            //     @action="handleAction"
            //     @click="handleClick"
            //     @submit="handleSubmit"
            //     ref="cell"
            // /> -->

import { computed } from 'vue';
import draggable from 'vuedraggable';
import Cell from './Cell.vue';

const props = defineProps([ 'modelValue', 'select', 'command' ]);
const emit = defineEmits(['update:modelValue', 'action', 'click', 'submit']);

function updateIdSource(id, newValue) {
    let updated = false;
    for (let i = 0; i < props.modelValue.length; i++) {
        if (props.modelValue[i].id === id) {
            props.modelValue[i].source = newValue;
            emit('update:modelValue', props.modelValue);
            updated = true;
            break;
        }
    }
    if (!updated) throw "Could not find cell id to update";
}

function isSubmit (content) {
    if (content.cell_type === 'code' && content.metadata !== undefined && content.metadata.submit === true) {
        return true;
    }
    return false;
}

function isHidden (content) {
    if (content.cell_type === 'code' && content.metadata !== undefined && content.metadata.hidden === true) {
        return true;
    }
    return false;
}

function isReadOnly (content) {
    if (content.metadata !== undefined && content.metadata.readonly === true) {
        return true;
    }
    return false;
}

function computeType (content) {
    if (content.cell_type === 'code') return 'code';
    if (content.cell_type === 'markdown') return 'markdown';
    if (content.cell_type === 'checkpoint') return 'checkpoint';
    throw "Illegal content type";
}

function computeSubtype (content) {
    if (content.cell_type === 'code') return '';
    if (content.cell_type === 'markdown' && content.metadata !== undefined && content.metadata.subtype === 'view') return 'view';
    if (content.cell_type === 'markdown' && content.metadata !== undefined && content.metadata.subtype === 'edit') return 'edit';
    if (content.cell_type === 'checkpoint' && content.metadata !== undefined && content.metadata.subtype === 'save') return 'save';
    if (content.cell_type === 'checkpoint' && content.metadata !== undefined && content.metadata.subtype === 'use') return 'use';
    throw "Illegal content subtype";
}

function isSelected (index) {
    return index === props.select;
}

function dragStart (event) {
    // const cm = this.$globalCMList;
    // for (var i = 0; i < cm.length; i++) {
    //     cm[i].__oldDragDrop = cm[i].getOption('dragDrop');
    //     cm[i].setOption('dragDrop', false);
    // }
}

function dragEnd (event) {
    const cm = this.$globalCMList;
    for (let i = 0; i < cm.length; i++) {
        cm[i].setOption('dragDrop', cm[i].__oldDragDrop);
    }
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
