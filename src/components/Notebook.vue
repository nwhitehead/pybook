<template>
  <!-- <div>
    <p>Testing</p>
    <Status value="Initializing" />
    <CellOutput :values="[output, output2, output3]" />
    <CheckPoint value="State" type="save" />
    <CellInput :value="code" id=0 :options="options" />
    <CellInput :value="code2" id=1 />
    <button @click="onClick">Update</button>
  </div> -->
  <div>
    <p>Welcome to the Notebook</p>
    <Status value="Initializing" />
    <Cell id="5" v-model="txt" :type="options.type" :subtype="'edit'" :output="[output, output2]" selected="true" />
    <Cell id="3" v-model:value="code2" :type="'python'" :output="[output3]"/>
    <button @click="onClick">Switch</button>
  </div>
</template>

<script setup>

import { reactive, ref } from "vue";
import Status from "./Status.vue";
import Cell from "./Cell.vue";
import CheckPoint from "./CheckPoint.vue";
import DataOutput from "./DataOutput.vue";
import CellOutput from "./CellOutput.vue";
import CellInput from "./CellInput.vue";

const txt = ref("blah");
const code = ref(`# Title\n\nThis is a *bold* move to _do_ it\nfor i in range(10):\n    print(10 * "Hello")\n\nThis is a *bold* move to _do_ it`);
const code2 = ref('second one');
const options = reactive({
  type:'python',
  indent: 2,
  lineNumbers: false,
  highlightLine: false,
  folding: false,
  matchBrackets: true,
  closeBrackets: false,
});
const output = ref({
  'text/plain': 'This is some regular text.',
});
const output2 = ref({
  'text/plain': 'This is some stderr text.',
  name: 'stderr',
});
const output3 = ref({
  'text/html': '<b>Bold</b> move',
});

function onClick() {
  console.log('onClick', options);
  if (options.type === 'python') {
    options.type = 'markdown';
  } else {
    options.type = 'python';
  }
}

</script>
