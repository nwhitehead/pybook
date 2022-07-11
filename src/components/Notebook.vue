<template>
  <div>
    <p>Welcome to the Notebook</p>
    <Cells
      v-model="arr"
      :select="1"
      :command="false"
    />
  </div>
</template>

<script setup>

import { reactive, ref } from "vue";
import Dropdown from "./Dropdown.vue";
import Status from "./Status.vue";
import Cell from "./Cell.vue";
import CheckPoint from "./CheckPoint.vue";
import DataOutput from "./DataOutput.vue";
import CellOutput from "./CellOutput.vue";
import CellInput from "./CellInput.vue";
import Cells from "./Cells.vue";

const cell0 = {
  source:'for i in range(10):\n    print(i)\n',
  outputs:[
    { 'text/plain': 'This is some regular text.' },
    { 'text/plain': 'This is some stderr text.', name: 'stderr' },
  ],
  id:0,
  cell_type:'code',
  language:'python',
};
const cell1 = {
  source:'x',
  outputs:[],
  id:1,
  cell_type:'code',
  language:'python',
};
const arr = ref([cell0, cell1]);

function insertCellBefore () {
  console.log('insertCellBefore');
}
</script>
