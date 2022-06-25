<template>
  <div class="filesave">
    <a class="dropdown-item" v-on:click.stop="action">{{ label }}</a>
  </div>
</template>

<script>
export default {
  props: ["value", "filename", "label"],
  methods: {
    action() {
      let a = document.createElement("a");
      const data = this.value;
      const blob = new Blob([data], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      a.download = this.filename;
      a.href = url;
      a.click();
    },
  },
};
</script>
