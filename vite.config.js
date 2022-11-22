
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    build: {
        target: [ 'es2020', 'chrome67', 'firefox68' ]
    },
    output: {
        inlineDynamicImports: true
    },
    plugins: [
        vue(),
        {
            name: "configure-response-headers",
            configureServer: (server) => {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    next();
                });
            },
        },
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
