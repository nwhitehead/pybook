<template>
  <div>
    <p>Welcome to the Notebook</p>
    <codemirror
      v-model="code"
      :style="{ height: '400px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @ready="log('ready', $event)"
      @change="log('change', $event)"
      @focus="log('focus', $event)"
      @blur="log('blur', $event)"
    />
  </div>
</template>

<script>
// import EventBus from "./EventBus.js";
import { ref } from "vue";
import { Codemirror } from "vue-codemirror";

export default {
  data() {
    return {};
  },
  components: {
    Codemirror,
  },
  setup() {
    const txt = ref(`Hello world`);
    const extensions = [];
    return { txt, extensions, log: console.log };
  },
};
</script>
