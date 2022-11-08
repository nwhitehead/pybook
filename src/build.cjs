
const vuePlugin = require('esbuild-plugin-vue3');
const sassPlugin = require('esbuild-plugin-sass');

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
    entryPoints: ['src/main_console.js', 'src/style.scss'],
    bundle: true,
    outdir: 'build',
    sourcemap: true,
    plugins: [vuePlugin(), sassPlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});

require('esbuild').build({
    entryPoints: ['src/main_code.js'],
    bundle: true,
    outdir: 'build',
    sourcemap: true,
    plugins: [vuePlugin(), sassPlugin()],
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
