<template>
  <div
    id="app"
    tabindex="0"
    @keydown.left.ctrl.exact.prevent="pagePrevious(state)"
    @keydown.right.ctrl.exact.prevent="pageNext(state)"
    @keydown.up.exact.prevent="ifCommand(cellPrevious, state)"
    @keydown.up.ctrl.exact.prevent="cellPrevious(state)"
    @keydown.down.exact.prevent="ifCommand(cellNext, state)"
    @keydown.down.ctrl.exact.prevent="cellNext(state)"
    @keydown.enter.exact.prevent="ifCommand(modeEdit)"
    @keydown.enter.shift.exact.prevent="cellEval(state); cellNext(state);"
    @keydown.enter.ctrl.exact.prevent="cellEval(state)"
    @keydown.enter.alt.exact.prevent="cellEval(state); insertCellAfter(state); cellNext(state);"
    @keydown.k.ctrl.exact.prevent="cellInterrupt()"
    @keydown.d.ctrl.shift.exact.prevent="cellDebug()"
    @keydown.escape.exact.prevent="ifEdit(modeCommand)"
    @keydown.a.exact="ifCommand(insertCellBefore, state)"
    @keydown.b.exact="ifCommand(insertCellAfter, state)"
    @keydown.c.exact="ifCommand(cellClearOutput, state)"
    @keydown.d.exact="ifCommand(deleteCell, state)"
    @keydown.y.exact="ifCommand(typeCellCode, state)"
    @keydown.m.exact="ifCommand(typeCellMarkdownEdit, state)"
    @keydown.m.shift.exact="ifCommand(typeCellMarkdownView, state)"
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
            { text:'Move page earlier', action:() => { movePageBefore(state); }},
            { text:'Move page later', action:() => { movePageAfter(state); }},
        ]" />
        <Dropdown name="Debug" :values="[
            { text:'Console dump', action:() => { debugDump(state); }},
            { text:'Clear local files', action:debugClear },
            { text:'Save notebook', action:debugSave },
            { divider:true },
            { text:'Save', filesave:true },
        ]" />
    </div>

    <Pagination :pages="state.cells.length" :current="state.page"
      @page="(p) => { pageSet(state, p); }" />
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
         pageNext, pagePrevious, pageSet,
         insertPageBefore, insertPageAfter, deletePage,
         movePageBefore, movePageAfter } from '../notebook.js';
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

function ifEdit (func, arg) {
  if (!command.value) {
    return func(arg);
  }
}

function ifCommand (func, arg) {
  if (command.value) {
    return func(arg);
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

//! Clear output of selected cell
function cellClearOutput (state) {
  const cell = getCell(state, state.page, state.select); 
  clearOutput(cell);
}

function cellEval (state) {
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

function cellDebug () {
  console.log('Notebook cellDebug');
  status.value = 'Interrupt';
  setInterrupt(5); // 5 is SIGTRAP
}

function handleClick (event) {
  state.select = event.id;
  modeEdit();
}

function debugDump (state) {
  const value = JSON.parse(JSON.stringify(state));
  console.log(value);
}

</script>
