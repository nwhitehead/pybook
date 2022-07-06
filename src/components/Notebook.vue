<template>
  <div>
    <p>Welcome to the Notebook</p>
    <CodeMirrorComponent></CodeMirrorComponent>
  </div>
</template>

<script>
// import EventBus from "./EventBus.js";
import CodeMirrorComponent from "./CodeMirrorComponent.vue";

export default {
  data: function () {
    return {};
  },
  components: {
    CodeMirrorComponent,
  },
};
</script>
