<template>
  <div class="filesave">
    <a class="button" v-on:click.stop="action">
      <slot>
        Save "{{ value.filename }}"
        <!-- Fallback label -->
      </slot>
    </a>
  </div>
</template>

<script setup>
const props = defineProps( ['value' ] );

function action() {
    let a = document.createElement('a');
    const data = props.value.data;
    const blob = new Blob([data], { type: props.value.content_type });
    const url = window.URL.createObjectURL(blob);
    a.download = props.value.filename;
    a.href = url;
    a.click();
}

</script>
