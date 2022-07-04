<template>
  <div>
    <Status v-bind:value="status"></Status>
    <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
    <Dropdown></Dropdown>
    <CodeMirrorComponent></CodeMirrorComponent>
    <Cells v-bind:values="cellsValues" v-bind:select="1" v-bind:command="false"></Cells>
    <FileSave v-bind:value="'contents'" v-bind:filename="'test.pbnb'">Save File</FileSave>
    <FileImport>Import</FileImport>
  </div>
</template>

<script>
import { onready } from "../onready.js";
import {
  signalMap,
  isBusy,
  isStarting,
  setStarting,
  setInterrupt,
  clearInterrupt,
  inputPut,
} from "../signal.js";
import { newPythonKernel } from "../python.js";
import { parse, unparse } from "../parser.js";
import { freshName } from "../fresh.js";

import Vue from "vue";
import EventBus from "./EventBus.js";
import Status from "./Status.vue";
import Pagination from "./Pagination.vue";
import Dropdown from "./Dropdown.vue";
import CodeMirrorComponent from "./CodeMirrorComponent.vue";
import DataOutput from "./DataOutput.vue";
import CellOutput from "./CellOutput.vue";
import CheckPoint from "./CheckPoint.vue";
import Cells from "./Cells.vue";
import Cell from "./Cell.vue";
import FileSave from "./FileSave.vue";
import FileImport from "./FileImport.vue";

import Store from "./Store.js";

export default {
  data: function () {
    return {
      status: "Initializing",
      cellsValues: [
        {
          source: "# A title\nSome text\n",
          cell_type: "markdown",
          metadata: { subtype: "view" },
        },
        { source: "print(2+2)\n", cell_type: "code" },
      ],
    };
  },
  components: {
    Status,
    Pagination,
    Dropdown,
    CodeMirrorComponent,
    DataOutput,
    CellOutput,
    CheckPoint,
    Cell,
    Cells,
    FileSave,
    FileImport,
  },
};
</script>
