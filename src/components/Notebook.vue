<template>
  <div>
    <p>Welcome to the Notebook</p>
    <Status value="Init" />
    <DataOutput v-bind:value="output" />
    <DataOutput v-bind:value="output2" />
    <CellInput v-bind:value="code" id=0 :options="options" />
    <CellInput v-bind:value="code2" id=1 />
    <button @click="onClick">Update</button>
  </div>
</template>

<script>
import Status from "./Status.vue";
import DataOutput from "./DataOutput.vue";
import CellInput from "./CellInput.vue";

export default {
  data() {
    return {
      code: "blah",
      code2: "second one",
      options: {
        type:'python',
      },
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
    CellInput,
  },
  methods: {
    onClick() {
      console.log('clicked');
      if (this.options.type === 'python') {
        this.options.type = 'markdown';
      } else {
      this.options.type = 'python';
      }
    }
  }
};
</script>
