<template>
    <div ref="terminal"><p>This is the terminal</p></div>
</template>

<script setup>

import { reactive, ref, watch, onMounted } from "vue";
import { Terminal } from 'xterm';

const terminal = ref(null);

const props = defineProps([ 'eventBus' ]);

const xterm = new Terminal();

onMounted(() => {
    xterm.open(terminal.value);
    xterm.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');
});

props.eventBus.on('stdout', event => {
    console.log('Terminal got stdout', event);
});

// watch(props.eventBus.bus, (bus) => {
//     console.log('Terminal watcher triggered', bus);
// });

</script>
