//!
//! Cell
//!
//! This is a Vue component representing one cell in a notebook.
//!
//!
//! Props:
//! - value
//! - output
//! - id - Unique identifier to keep track of this cell
//! - selected - true when this cell should be drawn selected
//! - type - 'code' or 'markdown'
//! - subtype - For type markdown, either 'edit' or 'show'
//! - state
//! - command
//! - hidden
//! - readonly
//! - submit
//!

<template>
    <div class="cell" v-bind:class="classObject" v-on:click.stop="handleClick" v-if="!hidden">
        <div class="side-left handle" :class="leftClass">
        </div>
        <div class="side-right" :class="rightClass">
            <div :class="readonlyClass" v-if="showEdit">
                <CellInput
                    v-bind:value="value"
                    v-bind:id="id"
                    v-bind:options="cmOptions"
                    v-on:update:value="handleInput"
                    v-on:action="handleAction"
                    ref="codemirror"
                />
            </div>
            <CheckPoint
                v-bind:value="value"
                v-bind:type="subtype"
                v-if="showCheckpoint"
            >
            </CheckPoint>
            <button class="button is-primary" v-if="submit" v-on:click.stop="handleSubmit">
                Submit
            </button>
            <CellOutput
                v-bind:values="filteredOutput"
                v-if="showResults"
            >
            </CellOutput>
        </div>
    </div>
</template>

<script>

import { marked } from 'marked';
import CellOutput from './CellOutput.vue';
import CodeMirrorComponent from './CodeMirrorComponent.vue';
import CheckPoint from './CheckPoint.vue';

export default {
    props: ['value', 'output', 'id', 'selected', 'type', 'subtype', 'state', 'command', 'hidden', 'readonly', 'submit'],
    computed: {
        cmOptions () {
            let options = { };
            if (this.type === 'code') {
                options.mode = 'python';
            }
            if (this.type === 'markdown') {
                options.mode = 'markdown';
            }
            options.readOnly = this.readonly;
            return options;
        },
        showEdit () {
            return this.type === 'code' || (this.type === 'markdown' && this.subtype === 'edit');
        },
        showResults () {
            return this.type === 'code' || this.type === 'markdown';
        },
        showCheckpoint () {
            return this.type === 'checkpoint';
        },
        readonlyClass: function () {
            return {
                'readonly-inner': this.readonly,
            };
        },
        classObject: function () {
            return {
                selected: this.selected,
                command: this.command,
                working: this.state === 'working',
                evaluated: this.state === 'evaluated',
                readonly: this.readonly,
            }
        },
        filteredOutput () {
            if (this.type === 'code') {
                return this.output;
            }
            if (this.type === 'markdown') {
                return [ {
                    output_type:'display_data',
                    data: {
                        'text/html': marked(this.value),
                    },
                } ];
            }
        },
        leftClass: function() {
            return {
                working: this.state === 'working',
                evaluated: this.state === 'evaluated',
            }
        },
        rightClass: function () {
            return {
                code: this.type === 'code',
                markdown: this.type === 'markdown',
            }
        },
    },
    methods: {
        handleInput (event) {
            this.$emit('update:value', { id:this.id, value:event });
        },
        handleAction (event) {
            this.$emit('action', { id:this.id, action:event.action });
        },
        handleClick (event) {
            this.$emit('click', { id:this.id });
        },
        handleSubmit (event) {
            this.$emit('submit', { id:this.id });
        },
        focus () {
            if (this.$refs.codemirror) {
                return this.$refs.codemirror.focus();
            } else {
                return false;
            }
        },
        blur () {
            if (this.$refs.codemirror) {
                return this.$refs.codemirror.blur();
            } else {
                return false;
            }
        }

    },
    components: {
        CellOutput,
        CellInput,
        CheckPoint,
    }
}

</script>
