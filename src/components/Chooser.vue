//!
//! Chooser
//!
//! A Vue component for choosing a document from a list.
//!
//! Documents can have fields, and user can sort list by fields (future work)
//!
//! Props:
//! - modelValue - An array of document objects, each of which has various fields
//! - fields - An array of fields, each field has "name" string, "title" string, and optional "display" function that takes field value and returns string
//!
//! Comparison is done with normal JavaScript comparison between field values. Store the values to be compared in "values", then if they need
//! different ways to be displayed then include a "display" function in the "fields". Fields are given in order to display left to right.
//! Fields are shown using "title" string on table.
//!
//! Emits:
//! - click - When a choice is clicked, payload is document object
//!

<template>
    <table class="table">
        <thead>
            <tr>
                <th v-for="field in fields">{{field.title}}</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in modelValue">
                <td v-for="field in fields" @click="handleClick(item)">{{item[field.name]}}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup>

const props = defineProps([ 'modelValue', 'fields' ]);

const emit = defineEmits([ 'click' ]);

function handleClick (item) {
    emit('click', item);
}

</script>
