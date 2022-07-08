<template>
  <div>
    <p>Welcome to the Notebook</p>
    <Status value="Initializing" />
    <CellOutput v-bind:values="[output, output2, output3]" />
    <CheckPoint value="State" type="save" />
    <CellInput v-bind:value="code" id=0 :options="options" />
    <CellInput v-bind:value="code2" id=1 />
    <button @click="onClick">Update</button>
  </div>
</template>

<script>
import Status from "./Status.vue";
import CheckPoint from "./CheckPoint.vue";
import DataOutput from "./DataOutput.vue";
import CellOutput from "./CellOutput.vue";
import CellInput from "./CellInput.vue";

export default {
  data() {
    return {
      code: `# Title\n\nThis is a *bold* move to _do_ it\nfor i in range(10):\n  print(10 * "Hello")\n\nThis is a *bold* move to _do_ it`,
      code2: "second one",
      options: {
        type:'python',
        indent: 2,
        lineNumbers: false,
        highlightLine: false,
        folding: false,
        matchBrackets: true,
        closeBrackets: false,
      },
      output: {
        'text/plain': 'This is some regular text.',
      },
      output2: {
        'text/plain': 'This is some stderr text.',
        name: 'stderr',
      },
      output3: {
        'text/html': '<b>Bold</b> move',
      },
    };
  },
  components: {
    Status,
    CheckPoint,
    CellOutput,
    DataOutput,
    CellInput,
  },
  methods: {
    onClick() {
      if (this.options.type === 'python') {
        this.options.type = 'markdown';
      } else {
      this.options.type = 'python';
      }
    }
  }
};
</script>
