//!
//! FileSave component
//!
//! This component shows a button to save a file.
//!
//! Default text is Save "filename". Can be overridden by slot text.
//!
//! Props:
//! - filename - What filename to use by default (user can change based on browser settings)
//! - data - Binary data for file (should be UInt8Array)
//!

<template>
  <div class="filesave">
    <a class="button" v-on:click.stop="action">
      <slot>
        Save "{{ filename }}"
        <!-- Fallback label -->
      </slot>
    </a>
  </div>
</template>

<script setup>
const props = defineProps( [ 'filename', 'data' ] );

function action() {
    let a = document.createElement('a');
    const data = props.data;
    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    a.download = props.filename;
    a.href = url;
    a.click();
}

</script>
