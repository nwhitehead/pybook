
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

function addHeaders(server) {
    server.middlewares.use((_req, res, next) => {
        if (_req.url === '/' || _req.url === '/index.html') {
        } else {
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        }
        next();
    });
}

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
            configureServer: addHeaders,
            configurePreviewServer: addHeaders,
        },
    ],
    worker: {
        rollupOptions: {
            external: [
                'node-fetch',
                'ws',
            ],
            output: {
                inlineDynamicImports: true,
            }
        },
    },
})
