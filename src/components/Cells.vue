
<template>
    <draggable
        class="cells"
        v-model='contents'
        handle=".handle"
        v-on:start="dragStart"
        v-on:end="dragEnd"
    >
        <cell
            v-for="(content, index) in contents"
            v-bind:value="content.source"
            v-bind:output="content.outputs"
            v-bind:id="index"
            v-bind:key="content.id"
            v-bind:selected="isSelected(index)"
            v-bind:command="isSelected(index) && command"
            v-bind:type="computeType(content)"
            v-bind:subtype="computeSubtype(content)"
            v-bind:state="content.state"
            v-bind:hidden="isHidden(content)"
            v-bind:readonly="isReadOnly(content)"
            v-bind:submit="isSubmit(content)"
            v-on:update:value="handleInput"
            v-on:action="handleAction"
            v-on:click="handleClick"
            v-on:submit="handleSubmit"
            ref="cell"
        >
        </cell>
    </draggable>
</template>

<script>

import draggable from 'vuedraggable';
import Cell from './Cell.vue';

export default {
    props: [ 'values', 'select', 'command' ],
    computed: {
        contents: {
            get() {
                return this.values;
            },
            set(values) {
                this.$emit('update:values', values);
            }
        }
    },
    methods: {
        isSubmit (content) {
            if (content.cell_type === 'code' && content.metadata !== undefined && content.metadata.submit === true) {
                return true;
            }
            return false;
        },
        isHidden (content) {
            if (content.cell_type === 'code' && content.metadata !== undefined && content.metadata.hidden === true) {
                return true;
            }
            return false;
        },
        isReadOnly (content) {
            if (content.metadata !== undefined && content.metadata.readonly === true) {
                return true;
            }
            return false;
        },
        computeType (content) {
            if (content.cell_type === 'code') return 'code';
            if (content.cell_type === 'markdown') return 'markdown';
            if (content.cell_type === 'checkpoint') return 'checkpoint';
            throw "Illegal content type";
        },
        computeSubtype (content) {
            if (content.cell_type === 'code') return '';
            if (content.cell_type === 'markdown' && content.metadata !== undefined && content.metadata.subtype === 'view') return 'view';
            if (content.cell_type === 'markdown' && content.metadata !== undefined && content.metadata.subtype === 'edit') return 'edit';
            if (content.cell_type === 'checkpoint' && content.metadata !== undefined && content.metadata.subtype === 'save') return 'save';
            if (content.cell_type === 'checkpoint' && content.metadata !== undefined && content.metadata.subtype === 'use') return 'use';
            throw "Illegal content subtype";

        },
        isSelected (index) {
            return index === this.select;
        },
        dragStart (event) {
            const cm = this.$globalCMList;
            for (var i = 0; i < cm.length; i++) {
                cm[i].__oldDragDrop = cm[i].getOption('dragDrop');
                cm[i].setOption('dragDrop', false);
            }
        },
        dragEnd (event) {
            const cm = this.$globalCMList;
            for (var i = 0; i < cm.length; i++) {
                cm[i].setOption('dragDrop', cm[i].__oldDragDrop);
            }
        },
        handleInput (event) {
            this.$emit('update:value', event);
        },
        handleAction (event) {
            this.$emit('action', event);
        },
        handleClick (event) {
            this.$emit('click', event);
        },
        handleSubmit (event) {
            this.$emit('submit', event);
        },
        focus (n) {
            return this.$refs.cell[n].focus();
        },
        blur (n) {
            return this.$refs.cell[n].blur();
        },
        blurAll () {
            // Check that this.values is defined
            // It can be undefined when all pages are deleted before fresh empty page is added
            if (this.values !== undefined) {
                for (let i = 0; i < this.values.length; i++) {
                    this.blur(i);
                }
            }
            return true;
        }
    },
    components: {
        draggable,
        Cell,
    },
}

</script>
