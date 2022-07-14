<template>
  <div
    id="app"
    tabindex="0"
    @keyup.enter.ctrl.exact="cellEval"
    @keyup.c.ctrl.exact="cellInterrupt"
  >
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

import { newPythonKernel } from '../python.js';
import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt,
         inputPut
       } from '../signal.js';

import { useCounterStore } from '../stores/notebook.js';

let normalstate = null;

const opts = {
  onReady: function (version) {
    //EventBus.$emit('update:status', 'Ready');
    console.log(version);
    python.freshstate(normalstate, {
      onResponse: function() {
        normalstate = 'State 0';
        console.log('Initial state setup');
      },
    });
  },
};
const python = newPythonKernel(opts);

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

function cellEval () {
  console.log('Notebook cellEval');
  const src = notebook.cells[notebook.select].source;
  console.log(src);
  clearInterrupt();
  python.evaluate(src, normalstate, {
    onResponse: function () {
      console.log('Got onResponse from evaluate');
    }
  });
}

function cellInterrupt () {
  console.log('Notebook cellInterrupt');
  setInterrupt();
}

function insertCellBefore () {
  console.log('insertCellBefore');
}

function handleClick (event) {
  notebook.select = event.id;
}


</script>
