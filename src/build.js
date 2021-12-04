
const vuePlugin = require('esbuild-vue');

require('esbuild').build({
    entryPoints: ['main.js'],
    bundle: true,
    outfile: 'build/out.js',
    plugins: [vuePlugin()],
    define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
    },
});
