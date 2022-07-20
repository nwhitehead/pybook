<template>
  <div
    id="app"
    tabindex="0"
    @keyup.enter.ctrl.exact="cellEval"
    @keyup.k.ctrl.exact="cellInterrupt"
  >
    <Status :value="status" />
    <Cells
      v-model="state.cells[state.page]"
      :select="state.select"
      :command="false"
      :allowDrag="true"
      @update:modelCellValue="newValue => { getCell(state, state.page, newValue.id).source = newValue.value; }"
      @click="handleClick"
    />
  </div>
  <Terminal :eventBus="customBus" />
</template>

<script setup>

import { reactive, ref, onMounted } from "vue";
import Dropdown from "./Dropdown.vue";
import Status from "./Status.vue";
import Cell from "./Cell.vue";
import CheckPoint from "./CheckPoint.vue";
import DataOutput from "./DataOutput.vue";
import CellOutput from "./CellOutput.vue";
import CellInput from "./CellInput.vue";
import Cells from "./Cells.vue";
import Terminal from "./Terminal.vue";
import { state, getCell, clearOutput, addOutput } from '../notebook.js';
import mitt from "mitt";

import { newPythonKernel } from '../python.js';
import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt,
         inputPut
       } from '../signal.js';

let normalstate = null;

let status = ref('Initializing');

const customBus = mitt();

onMounted(() => {

  customBus.emit('prompt', '>>> ');
  customBus.on('input', msg => {
    console.log('Got terminal input: ', msg);
    clearInterrupt();
    if (status.value === 'Initializing' || status.value === 'Working') {
      customBus.emit('stdout', 'Python is not ready yet\n');
      customBus.emit('prompt', '>>> ');
      return;
    }
    status.value = 'Working';
    python.evaluate(msg, normalstate, {
      onStdout: function (msg) {
        customBus.emit('stdout', msg);
      },
      onStderr: function (msg) {
        customBus.emit('stderr', msg);
      },
      onOutput: function(content_type, msg) {
        if (content_type === 'text/html') {
          customBus.emit('stdout', '<html>' + msg + '</html>');
        } else if (content_type === 'text/plain') {
          customBus.emit('stdout', msg);
        } else if (content_type === 'image/svg+xml') {
          customBus.emit('stdout', '<svg>' + msg + '</svg>');
        }
      },
      onResponse: function () {
        // Check that status was previously working in case there was an interrupt
        if (status.value === 'Working') {
          status.value = 'Ready';
        }
        // Done, ready for more input now
        customBus.emit('prompt', '>>> ');
      }
    });
  });
});

const opts = {
  onReady: function (version) {
    status.value = 'Ready';
    console.log(version);
    python.freshstate(normalstate, {
      onResponse: function() {
        normalstate = 'State 0';
      },
    });
  },
};

const python = newPythonKernel(opts);

function cellEval () {
  const cell = getCell(state, state.page, state.select); 
  if (cell.cell_type === 'code') {
    if (status.value === 'Initializing' || status.value === 'Working') {
      console.log('Python is not ready yet');
      return;
    }
    clearOutput(cell);
    const src = cell.source;
    cell.state = 'working';
    clearInterrupt();
    status.value = 'Working';
    python.evaluate(src, normalstate, {
      onStdout: function (msg) {
          addOutput(cell, { name: 'stdout', 'text/plain': msg });
      },
      onStderr: function (msg) {
          addOutput(cell, { name: 'stderr', 'text/plain': msg });
      },
      onOutput: function(content_type, msg) {
        if (content_type === 'text/html') {
          addOutput(cell, { 'text/html': msg });
        } else if (content_type === 'text/plain') {
          addOutput(cell, { name: 'stdout', 'text/plain': msg });
        } else if (content_type === 'image/svg+xml') {
          addOutput(cell, { name: 'stdout', 'text/svg+xml': msg });
        }
      },
      onResponse: function () {
        // Check that status was previously working in case there was an interrupt
        if (status.value === 'Working') {
          status.value = 'Ready';
        }
        cell.state = 'evaluated';
      }
    });
  }
}

function cellInterrupt () {
  console.log('Notebook cellInterrupt');
  status.value = 'Interrupt';
  setInterrupt();
}

function insertCellBefore () {
  console.log('insertCellBefore');
}

function handleClick (event) {
  state.select = event.id;
}


</script>
