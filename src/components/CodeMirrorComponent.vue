<template>
  <div class="cellinput">
    <textarea class="cellinput"></textarea>
  </div>
</template>

<script>
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";

import EventBus from "./EventBus.js";

export default {
  props: ["options", "value", "id"],
  mounted: function () {
    var self = this;
    var elem = self.$el;
    self.startState = EditorState.create({
      doc: self.value || "",
      extensions: [keymap.of(defaultKeymap)],
    });
    self.editor = new EditorView({
      state: self.startState,
      parent: elem,
    });
    // Vue global variable $globalCMList keeps track of all instances of CodeMirror (so we can shuffle them easily on drag)
    if (self.$globalCMList === undefined) {
      self.$globalCMList = [];
    }
    self.$globalCMList.push(self.editor);

    self.editor.on("change", function (cm) {
      self.$emit("update:value", cm.getValue());
    });
    self.editor.on("focus", function (cm) {
      EventBus.$emit("cmfocus", { id: self.id });
    });
    self.editor.setOption("extraKeys", {
      // Remove default actions for commands handled at higher app level
      "Ctrl-Up": function (cm) {},
      "Ctrl-Down": function (cm) {},
      "Ctrl-Left": function (cm) {},
      "Ctrl-Right": function (cm) {},
      Esc: function (cm) {},
      "Ctrl-Enter": function (cm) {},
      "Shift-Enter": function (cm) {},
      "Alt-Enter": function (cm) {},
      "Ctrl-C": function (cm) {},
      "Ctrl-K": function (cm) {},
      "Ctrl-I": function (cm) {},
      // Make pressing "tab" key insert spaces to correct indent level
      Tab: function (cm) {
        let spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces);
      },
    });
  },
  watch: {
    value: function (v) {
      var currentValue = this.editor.getValue();
      if (currentValue !== v) {
        this.editor.setValue(v);
      }
    },
    options: function (opts) {
      // If options changes, need to set each one in editor
      Object.entries(opts).forEach(([k, v]) => {
        this.editor.setOption(k, v);
      });
    },
  },
  methods: {
    focus() {
      this.editor.focus();
      return true;
    },
    blur() {
      this.editor.getInputField().blur();
      return true;
    },
  },
};
</script>
