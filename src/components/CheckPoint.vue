//!
//! CheckPoint
//!
//! This is a Vue component that represents a checkpoint in the notebook.
//!
//! Props:
//! - value - This is the name of the checkpoint.
//! - type - "save" or "use"
//!

<template>
    <div class="checkpoint tags are-medium has-addons">
        <span :class="checkpointClassLeft()">{{ checkpointText() }}</span>
        <span :class="checkpointClassMiddle()">{{ value }}</span>
    </div>
</template>

<style>
div.checkpoint {
    padding: 10px 8px 10px 10px;
}
</style>

<script setup>

const props = defineProps(['value', 'type']);

function checkpointClassLeft () {
    return {
        'tag': true,
        'is-primary': props.type === 'save',
        'is-link': props.type === 'use',
    }
}

function checkpointClassMiddle () {
    return {
        'tag': true,
    }
}

function checkpointText () {
    if (props.type === 'save') return 'Save';
    if (props.type === 'use') return 'From';
    throw 'Illegal checkpoint type';
}

</script>
