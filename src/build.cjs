
const vuePlugin = require('esbuild-plugin-vue3');

require('esbuild').build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'build/main.js',
    sourcemap: true,
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

require('esbuild').build({
    entryPoints: ['src/main_console.js'],
    bundle: true,
    outfile: 'build/main_console.js',
    sourcemap: true,
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

require('esbuild').build({
    entryPoints: ['src/worker.js'],
    bundle: true,
    outfile: 'build/worker.js',
    sourcemap: true,
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});
