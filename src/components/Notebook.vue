<template>
  <div
    id="app"
    tabindex="0"
    @keyup.enter.ctrl.exact="cellEval"
    @keyup.k.ctrl.exact="cellInterrupt"
    @keyup.escape.exact="ifEdit(modeCommand)"
    @keyup.enter.exact="ifCommand(modeEdit)"
    @keyup.up.exact="ifCommand(() => { cellPrevious(state) })"
    @keyup.down.exact="ifCommand(() => { cellNext(state) })"
    ref="appref"
  >
    <Status :value="status" />
    <div id="menu">
        <Dropdown name="Cell" :values="[
            { text:'Insert new cell before', action:() => { insertCellBefore(state); }},
            { text:'Insert new cell after', action:() => { insertCellAfter(state); }},
            { text:'Delete cell', action:() => { deleteCell(state); }},
            { divider:true },
            { text:'Move cell up', action:() => { moveCellBefore(state); }},
            { text:'Move cell down', action:() => { moveCellAfter(state); }},
            { divider:true },
            { text:'Type - Code', action:() => { typeCellCode(state); }},
            { text:'Type - MarkDown - Edit', action:() => { typeCellMarkdownEdit(state); }},
            { text:'Type - MarkDown - View', action:() => { typeCellMarkdownView(state); }},
        ]" />
        <Dropdown name="Page" :values="[
            { text:'Insert new page before', action:() => { insertPageBefore(state); }},
            { text:'Insert new page after', action:() => { insertPageAfter(state); }},
            { text:'Delete page', action:() => { deletePage(state); }},
            { divider:true },
            { text:'Move page earlier', action:movePageBefore },
            { text:'Move page later', action:movePageAfter },
        ]" />
        <Dropdown name="Debug" :values="[
            { text:'Console dump', action:debugDump },
            { text:'Clear local files', action:debugClear },
            { text:'Save notebook', action:debugSave },
            { divider:true },
            { text:'Save', filesave:true },
        ]" />
    </div>

    <Pagination :pages="state.cells.length" :current="state.page"
      @page="(p) => { state.page = p; }" />
    <Cells
      v-model="state.cells[state.page]"
      :select="state.select"
      :command="command"
      :allowDrag="true"
      @update:modelCellValue="newValue => { getCell(state, state.page, newValue.id).source = newValue.value; }"
      @click="handleClick"
    />
  </div>
  <Terminal :eventBus="customBus" />
</template>

<script setup>

import { reactive, ref, onMounted } from "vue";
import Cell from "./Cell.vue";
import CellInput from "./CellInput.vue";
import CellOutput from "./CellOutput.vue";
import Cells from "./Cells.vue";
import CheckPoint from "./CheckPoint.vue";
import DataOutput from "./DataOutput.vue";
import Dropdown from "./Dropdown.vue";
import Pagination from "./Pagination.vue";
import Status from "./Status.vue";
import Terminal from "./Terminal.vue";
import { state, getCell, clearOutput, addOutput,
         cellPrevious, cellNext,
         insertCellBefore, insertCellAfter, deleteCell,
         moveCellBefore, moveCellAfter,
         typeCellCode, typeCellMarkdownEdit, typeCellMarkdownView,
         insertPageBefore, insertPageAfter, deletePage } from '../notebook.js';
import mitt from "mitt";

import { newPythonKernel } from '../python.js';
import { signalMap,
         isBusy,
         isStarting, setStarting,
         setInterrupt, clearInterrupt,
         inputPut
       } from '../signal.js';

let normalstate = null;
let appref = ref(null);

let status = ref('Initializing');
let command = ref(false);

const customBus = mitt();

function ifEdit (func) {
  if (!command.value) {
    return func();
  }
}

function ifCommand (func) {
  if (command.value) {
    return func();
  }
}

function modeEdit () {
  command.value = false;
}

function modeCommand () {
  command.value = true;
  appref.value.focus();
}

onMounted(() => {

  customBus.emit('prompt', '>>> ');
  customBus.on('input', msg => {
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

function handleClick (event) {
  state.select = event.id;
  modeEdit();
}


</script>
