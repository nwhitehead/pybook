<template>
  <div>
    <p>Welcome to the Notebook</p>
    <Cells
      v-model="notebook.cells"
      :select="notebook.select"
      :command="false"
      :allowDrag="true"
      @click="handleClick"
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

const notebook = reactive({
  select: 0,
  cells: [
    {
      id:0,
      source:'for i in range(10):\n    print(i)\n',
      outputs:[
        { 'text/plain': 'This is some regular text.' },
        { 'text/plain': 'This is some stderr text.', name: 'stderr' },
      ],
      cell_type:'code',
      language:'python',
    },
    {
      id:1,
      source:'x',
      outputs:[],
      cell_type:'code',
      language:'python',
    },
  ],
});

function insertCellBefore () {
  console.log('insertCellBefore');
}

function handleClick (event) {
  notebook.select = event.id;
}

</script>
