//!
//! CellInput
//!
//! This is a Vue component that represents a cell input area. It is built using CodeMirror. The cell can have
//! syntax highlighting for Python or Markdown.
//!
//! With multiple cells in a notebook, normal situation is that one CellInput has canFocus true, other have false.
//! In command mode everything has canFocus set to false.
//!
//! Props:
//! - modelValue - This is the main text contents inside the cell input.
//! - id - This is set by creator
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
//!     singleLine - Force editor to only allow single line of input (default false)
//!     canFocus - Allow input area to be focused by user (default true)
//!
//! Events:
//! - update:modelValue - Emitted when modelValue changes, payload is value
//!
//! NOTE: This component requires clearing the VueCodemirror global extensions.
//!

<template>
  <div :class="{ cellinput:true, python:isPython, markdown:isMarkdown }">
    <codemirror
      v-model="modelValue"
      :style="{ maxHeight: '600px' }"
      :autofocus="!disabled"
      :indent-with-tab="true"
      :tab-size="indent"
      :extensions="extensions"
      :disabled="disabled"
      ref="cmElement"
      @update:modelValue="newValue => { $emit('update:modelValue', newValue); }"
    />
  </div>
</template>

<style>
div.cellinput {
    height: auto;
    width: 100%;
    background-color: #f6f6f6;
    padding: 5px 8px 5px 10px;
    margin: 10px 0 10px 0;
    border: 1px solid #f0f4ff;
    border-radius: 4px;
    height: auto;
    z-index: 0;
}
div.cellinput.python {
    background-color: #f6faff;
}
div.cellinput.markdown {
    background-color: #fffaf6;
}
.cm-editor.cm-focused { outline: none !important }
</style>

<script setup>

import { computed, ref, watch, nextTick } from "vue";
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

const props = defineProps([ 'modelValue', 'id', 'options' ]);
const emit = defineEmits([ 'update:modelValue' ]);

let cmElement = ref(null);

function nop(target) {
  return true;
}

const blankKeymap = [
  { key:'Ctrl-ArrowUp', run: nop },
  { key:'Ctrl-ArrowDown', run: nop },
  { key:'Ctrl-ArrowLeft', run: nop },
  { key:'Ctrl-ArrowRight', run: nop },
  { key:'Ctrl-Enter', run: nop },
  { key:'Shift-Enter', run: nop },
  { key:'Alt-Enter', run: nop },
  { key:'Ctrl-k', run: nop },
  { key:'Ctrl-Shift-k', run: nop },
  { key:'Ctrl-i', run: nop },
  { key:'Escape', run: nop },
];

const ignoreInputDropExtension = function () {
  return EditorState.transactionFilter.of(transaction => {
    if (transaction.isUserEvent('input.drop')) {
      return; // Ignore input.drop transactions
    }
    return transaction;
  });
};

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
  // Custom drag and drop handler
  ignoreInputDropExtension(),
  keymap.of([
    ...blankKeymap,
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
  // For single line mode, filter out any transaction that increases lines past 1
  if (opts.singleLine) {
    ext.push(EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr));
  }
  return ext;
});

const isPython = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.type === 'python';
});

const isMarkdown = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.type === 'markdown';
});

const disabled = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.readonly || (opts.canFocus === false);
});

const indent = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.indent ? opts.indent : 4; // default to 4 if none set
});

watch(disabled, (newValue, oldValue) => {
  // Watch for CellInput that goes from disabled to not disabled
  // Need to focus textbox of editor in that case (avoid needing to click 2 times to get focus)
  if (!newValue && oldValue) {
    // We need the DOM element of the codemirror component, get it with $el
    const cmDomElement = cmElement.value.$el;
    // Now find the right part that accepts focus
    const textBox = cmDomElement.querySelectorAll('[role="textbox"]');
    // Need to wait for DOM update to do actual focus
    // At this point we have flag changed, but DOM not updated yet
    nextTick(() => {
      textBox.forEach( (el) => {
        el.focus();
      });
    });
  }
});

</script>
