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
//!     type - Can be "python" or "markdown"
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

<script>
import { ref } from "vue";
import { Codemirror } from "vue-codemirror";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";

import EventBus from "./EventBus.js";

export default {
  props: [ "value", "id", "options" ],
  components: {
    Codemirror,
  },
  setup() {
    const txt = ref(this.value);
    let extensions = [];
    if (this.options && this.options.type === 'python') {
      extensions.push(python());
    }
    return { txt, extensions };
  },
};
</script>
