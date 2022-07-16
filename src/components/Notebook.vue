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
      @update:modelCellValue="newValue => { updateCellIdSource(notebook.cells, newValue.id, newValue.value); }"
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

import { useNotebook } from '../stores/notebook.js';

const nbstore = useNotebook();

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
      source:'import time\nfor i in range(10):\n    print(i)\n    time.sleep(0.5)\n',
      outputs:[
        { 'text/plain': 'This is some regular text.' },
        { 'text/plain': 'This is some stderr text.', name: 'stderr' },
      ],
      cell_type:'code',
      language:'python',
      state:'',
    },
    {
      id:1,
      source:"_That's all folks_",
      outputs:[],
      cell_type:'markdown',
      subtype:'edit',
      language:'python',
    },
  ],
});

function getCellId(value, id) {
  //! Get cell by specific id
  for (let i = 0; i < value.length; i++) {
    if (value[i].id === id) {
      return value[i];
    }
  }
  throw 'Could not find cell id';
}

function updateCellIdSource(value, id, newValue) {
  const cell = getCellId(value, id);
  cell.source = newValue;
}

function cellEval () {
  console.log('Notebook cellEval');
  const cell = getCellId(notebook.cells, notebook.select); 
  if (cell.cell_type === 'code') {
    const src = cell.source;
    console.log(src);
    getCellId(notebook.cells, notebook.select).state = 'working';
    clearInterrupt();
    python.evaluate(src, normalstate, {
      onResponse: function () {
        cell.state = 'evaluated';
      }
    });
  } else {
    console.log('Updating markdown mathjax');
    console.log(cell);
    MathJax.typeset([]);
  }
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
