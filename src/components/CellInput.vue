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
//!     indent - Number of spaces per indent level (default 4)
//!     readonly - True if the editor should be readonly (default false)
//!     type - Can be "python" or "markdown" (undefined will be generic text editor)
//!     lineNumbers - Set to true to get line numbers (default false)
//!     highlightLine - Set to true to get horizontal line highlight (default false)
//!     folding - Set to true to allow folding of subsections (default false)
//!     matchBrackets - Show matching brackets (default true)
//!     closeBrackets - Add closing brackets automatically (default false)
//!     highlightSelectionMatches - Show matching selections (default false)
//!     autocomplete - Turn on autocomplete keys and functionality (default false)

//!
//! Events:
//! - "update:value" - Emitted when value changes, payload is { id, value }
//! - "focus" - Emitted when cell is focused, payload is { id }
//! - "blur" - Emitted when cell loses focus, payload is { id }

<template>
  <div class="cellinput">
    <codemirror
      v-model="value"
      :style="{ maxHeight: '800px' }"
      :autofocus="false"
      :indent-with-tab="true"
      :tab-size="indent"
      :extensions="extensions"
      :disabled="disabled"
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
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
        rectangularSelection, crosshairCursor,
        lineNumbers, highlightActiveLineGutter } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
        foldGutter, foldKeymap } from "@codemirror/language"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"

import EventBus from "./EventBus.js";

const props = defineProps([ 'value', 'id', 'options' ]);

const defaultExtensions = (() => [
  // Highlight special characters
  highlightSpecialChars(),
  // Keep undo history
  history(),
  // Draw selection, needed to allow multiple selections and rectangle selection
  drawSelection(),
  // Draw cursor when something is dragged over text
  dropCursor(),
  // Allow multiple selections
  EditorState.allowMultipleSelections.of(true),
  // Allow auto indent for languages that support it
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  // Allow rectangular selection with Alt
  rectangularSelection(),
  // Show crosshair on rectangular selection
  crosshairCursor(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
  ])
])()

const extensions = computed(() => {
  // Extensions are reactive to options, computed to avoid recomputing on every template render
  let ext = [ defaultExtensions ];
  const opts = props.options ? props.options : {};
  // Put in optional editor extensions
  if (opts.lineNumbers) {
    ext.push(lineNumbers());
  }
  if (opts.highlightLine) {
    ext.push(highlightActiveLineGutter());
    ext.push(highlightActiveLine());
  }
  if (opts.folding) {
    ext.push(foldGutter());
  }
  if (opts.matchBrackets !== false) {
    ext.push(bracketMatching());
  }
  if (opts.closeBrackets) {
    ext.push(closeBrackets());
  }
  if (opts.highlightSelectionMatches) {
    ext.push(highlightSelectionMatches());
  }
  // Put in syntax highlighting language
  if (opts.type === 'python') {
    ext.push(python());
  }
  if (opts.type === 'markdown') {
    ext.push(markdown());
  }
  return ext;
});

const disabled = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.readonly;
});

const indent = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.indent ? opts.indent : 4; // default to 4 if none set
});

</script>
