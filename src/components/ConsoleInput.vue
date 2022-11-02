//!
//! CellInput
//!
//! This is a Vue component that represents a multiline console input area. It is built using CodeMirror. The cell can have
//! syntax highlighting for Python (optional).
//!
//! Props:
//! - modelValue - This is the main text contents inside the cell input.
//! - options - This is a dict of options related to the editor
//!     indent - Number of spaces per indent level (default 4)
//!     readonly - True if the editor should be readonly (default false)
//!     type - Can be "python" or undefined (generic text editor)
//!     lineNumbers - Set to true to get line numbers (default false)
//!     highlightLine - Set to true to get horizontal line highlight (default false)
//!     folding - Set to true to allow folding of subsections (default false)
//!     matchBrackets - Show matching brackets (default true)
//!     closeBrackets - Add closing brackets automatically (default false)
//!     highlightSelectionMatches - Show matching selections (default false)
//!     singleLine - Force editor to only allow single line of input (default false)
//!     canFocus - Allow input area to be focused by user (default true)
//!     ready - Is state ready for submitting input (default true)
//!     evalSingleLine - If true then pressing Enter on single line will evaluate (default true)
//!
//! Events:
//! - update:modelValue - Emitted when modelValue changes, payload is value
//! - evaluate - Emitted when user requests text to be evaluated/passed as input
//!
//! NOTE: This component requires clearing the VueCodemirror global extensions.
//!

<template>
  <div :class="{ consoleinput:true, python:isPython, ready:isReady }">
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
div.consoleinput {
    height: auto;
    width: 100%;
    padding: 5px 8px 5px 10px;
    margin: 10px 0 10px 0;
    height: auto;
    z-index: 0;
}
.cm-editor.cm-focused { outline: none !important }
</style>

<script setup>

import { computed, ref, watch, nextTick } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { python } from '@codemirror/lang-python';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor,
        rectangularSelection, crosshairCursor,
        lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching,
        foldGutter, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap, insertNewlineAndIndent } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

const props = defineProps([ 'modelValue', 'options' ]);
const emit = defineEmits([ 'update:modelValue', 'evaluate', 'interrupt', 'clear', 'historyPrevious', 'historyNext', 'reset' ]);

//! Function to call when up key pressed
//! Check if moving off the top of editor, if so do historyPrevious
function up(editorView) {
    const state = editorView.viewState.state;
    const selection = editorView.viewState.state.selection.ranges[0].from;
    const info = state.doc.lineAt(selection);
    if (info.number === 1) {
        emit('historyPrevious');
        return true;
    }
    return false;
}

//! Function to call when down key pressed
//! Check if moving off the bottom of editor, if so do historyNext
function down(editorView) {
    const state = editorView.viewState.state;
    const selection = editorView.viewState.state.selection.ranges[0].from;
    const info = state.doc.lineAt(selection);
    const maxlines = state.doc.lines;
    if (info.number === maxlines) {
        emit('historyNext');
        return true;
    }
    return false;
}

let cmElement = ref(null);

//! Function to call when Enter is pressed
//! If we are in multiline mode, pass through as normal
//! If we are in single line mode, this is equivalent to evaluate (Ctrl-Enter)
function enter(editorView) {
    const lines = props.modelValue.split('\n').length;
    if (lines <= 1) {
        if (evalSingleLine.value) {
            emit('evaluate');
            return true;
        }
    }
    return false;
}

function nop(target) {
    return true;
}

const blankKeymap = [
    { key:'ArrowUp', run: up },
    { key:'ArrowDown', run: down },
    { key:'Enter', run: enter },
    { key:'Shift-Enter', run: insertNewlineAndIndent },
    { key:'Ctrl-ArrowUp', run: () => { emit('historyPrevious'); return true; } },
    { key:'Ctrl-ArrowDown', run: () => { emit('historyNext'); return true; } },
    { key:'Ctrl-Enter', run: () => { emit('evaluate'); return true; } },
    { key:'Ctrl-c', run: () => { emit('interrupt'); return true; } },
    { key:'Ctrl-l', run: () => { emit('clear'); return true; } },
    { key:'Ctrl-Shift-l', run: () => { emit('reset'); return true; } },
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

const disabled = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.readonly || (opts.canFocus === false);
});

const indent = computed(() => {
  const opts = props.options ? props.options : {};
  return opts.indent ? opts.indent : 4; // default to 4 if none set
});

const isReady = computed(() => {
    const opts = props.options ? props.options : {};
    return opts.ready;
});

const evalSingleLine = computed(() => {
    const opts = props.options ? props.options : {};
    return !(opts.evalSingleLine === false);  // default true if not present
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
