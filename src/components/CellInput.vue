//!
//! CellInput
//!
//! This is a Vue component that represents a cell input area. It is built using CodeMirror. The cell can have
//! syntax highlighting for Python or Markdown.
//!
//! Props:
//! - value - This is the main text contents inside the cell input.
//! - id - This is set by component creator, will be passed in emitted messages to keep cells easy to distinguish
//! - options - This is a dict of options related to the editor
//!     readonly - True if the editor should be readonly
//!     type - Can be "python" or "markdown" (undefined will be generic text editor)
//!
//! Events:
//! - "update:value" - Emitted when value changes, payload is { id, value }
//! - "focus" - Emitted when cell is focused, payload is { id }
//! - "blur" - Emitted when cell loses focus, payload is { id }

<template>
  <div class="cellinput">
    <codemirror
      v-model="value"
      :style="{ height: '200px' }"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="4"
      :extensions="extensions"
      @change="$emit('update:value', { id, value:$event })"
      @focus="$emit('focus', { id })"
      @blur="$emit('blur', { id })"
      class="cellinput"
    />
  </div>
</template>

<script setup>

import { computed, ref } from "vue";
import { Codemirror } from "vue-codemirror";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";

import EventBus from "./EventBus.js";

const props = defineProps([ 'value', 'id', 'options' ]);

const extensions = computed(() => {
  // Extensions are reactive to options, computed to avoid recomputing on every template render
  let ext = [];
  if (props.options && props.options.type === 'python') {
    ext.push(python());
  }
  if (props.options && props.options.type === 'markdown') {
    ext.push(markdown());
  }
  return ext;
});

</script>
