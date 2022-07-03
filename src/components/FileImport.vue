<template>
  <div class="fileimport">
    <span>
      <slot>
        File Import
        <!-- Fallback label -->
      </slot>
    </span>
    <input id="filebutton" type="file" ref="select" @change="readFile()" />
  </div>
</template>

<script>
export default {
  props: [],
  methods: {
    readFile() {
      const self = this;
      this.file = this.$refs.select.files[0];
      const reader = new FileReader();
      reader.onload = (res) => {
        self.$emit("load", { filename: self.file.name, value: res.target.result });
      };
      reader.onerror = (err) => console.log(err);
      reader.readAsText(this.file);
    },
  },
};
</script>
