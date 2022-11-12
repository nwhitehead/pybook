
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    build: {
        target: [ 'es2020', 'chrome67', 'firefox68' ]
    },
    output: {
        inlineDynamicImports: true
    },
    plugins: [
        vue(),
        crossOriginIsolation()
    ],
    worker: {
        rollupOptions: {
            external: [
                'node-fetch'
            ],
            output: {
                inlineDynamicImports: true,
            }
        },
},
})
