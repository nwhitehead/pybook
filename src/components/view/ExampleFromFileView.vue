//!
//! ExampleFromFileView
//!
//! A Vue component representing a single ExampleFromFile
//!
//! Props:
//! - fileContents - Contents of file (see ExampleFromFile component)
//!

<template>
    <div class="container">
        <div class="content">
            <ExampleFromFile :fileContents="props.fileContents" />
        </div>
    </div>
</template>

<script setup>

import ExampleFromFile from '../ExampleFromFile.vue';

const props = defineProps([ 'fileContents' ]);

</script>
