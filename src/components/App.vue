<template>
    <div>
        Hello from the App
        <Status v-bind:value="status"></Status>
        <Pagination v-bind:pages="10" v-bind:current="1"></Pagination>
        <Dropdown></Dropdown>
        <CodeMirrorComponent></CodeMirrorComponent>
        <DataOutput v-bind:value="testout" v-bind:isResult="true"></DataOutput>
        <CellOutput v-bind:values="covalues"></CellOutput>
        <CheckPoint v-bind:value="'0'" v-bind:type="'use'"></CheckPoint>
        <Cell
            v-bind:value="cellValue"
            v-bind:output="covalues"
            v-bind:selected="false"
            v-bind:id="'abc'"
            v-bind:type="'markdown'"
            v-bind:subtype="'display'"
            v-bind:state="''"
            v-bind:command="false"
            v-bind:hidden="false"
            v-bind:readonly="false"
            v-bind:submit="false"
        ></Cell>
        <Cells
            v-bind:values="cellsValues"
            v-bind:select="0"
            v-bind:command="false"
        ></Cells>
    </div>
</template>

<script>
import Vue from 'vue';
import EventBus from './EventBus.js';
import Status from './Status.vue';
import Pagination from './Pagination.vue';
import Dropdown from './Dropdown.vue';
import CodeMirrorComponent from './CodeMirrorComponent.vue';
import DataOutput from './DataOutput.vue';
import CellOutput from './CellOutput.vue';
import CheckPoint from './CheckPoint.vue';
import Cell from './Cell.vue';
import Cells from './Cells.vue';
import Store from './Store.js';

export default {
    data: function () {
        return {
            'status': 'Initializing',
            'testout': {
                'text/plain': 'This is some pre formatted output',
            },
            'covalues': [
                {
                    output_type: 'stream',
                    name: 'stdout',
                    text: 'Hello world',
                },
            ],
            cellValue: '# This is the title\nSome more text\n',
            cellsValues: [
                { source:"# A title\nSome text\n", cell_type:'markdown', metadata: { subtype:'view' } },
                { source:'print(2+2)\n', cell_type:'code' },
            ],
        }
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
    }
}
</script>
