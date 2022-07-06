<template>
  <div>
    <p>Welcome to the Notebook</p>
    <Status value="Working" />
    <DataOutput v-bind:value="output" />
    <DataOutput v-bind:value="output2" />
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
import Status from "./Status.vue";
import DataOutput from "./DataOutput.vue";

// import EventBus from "./EventBus.js";
import { ref } from "vue";
import { Codemirror } from "vue-codemirror";

export default {
  data() {
    return {
      code: "blah",
      output: {
        "text/plain": "This is some regular text.",
      },
      output2: {
        "text/html": "<b>Bold</b> move",
      },
    };
  },
  components: {
    Status,
    DataOutput,
    Codemirror,
  },
  setup() {
    const txt = ref(this.code);
    const extensions = [];
    return { txt, extensions, log: console.log };
  },
};
</script>
