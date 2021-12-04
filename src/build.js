
const vuePlugin = require('esbuild-vue');

require('esbuild').build({
    entryPoints: ['main.js'],
    bundle: true,
    outfile: 'out.js',
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});
