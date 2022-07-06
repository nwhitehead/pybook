
const vuePlugin = require('esbuild-plugin-vue3');

require('esbuild').build({
    entryPoints: ['src/main.js'],
    bundle: true,
    outfile: 'build/out.js',
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});
