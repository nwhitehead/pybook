//!
//! FileUpload component
//!
//! This component shows a button to upload a specific file.
//!
//! Default text is 'Upload to "filename"'. Can be overridden by slot text.
//!
//! Props:
//! - filename - What filename to use
//!
//! Emits:
//! - data - Payload is data from upload of file (ArrayBuffer)
//!
//! Listener for data emit needs to call setIOComplete() to unblock synchronous upload Python command.
//!

<template>
  <div class="fileupload pb-5">
    <label class="button" :disabled="done">
        <input type="file" :disabled="done" @change="choose" ref="fileinput" />
        Upload to "{{ filename }}"
    </label>
  </div>
</template>

<style>
input[type="file"] {
    display: none;
}
</style>

<script setup>

import { ref } from 'vue';

const props = defineProps([ 'filename' ]);
const emit = defineEmits([ 'data' ]);

const fileinput = ref(null);
const done = ref(null);

async function choose() {
    if (!done.value) {
        // Get File object
        const file = fileinput.value.files[0];
        // Read all contents, wait for them to be available
        const contents = await file.arrayBuffer();
        const data = new Uint8Array(contents);
        emit('data', data);
        // Emit is done, disable this control now
        done.value = true;
    }
}

</script>
