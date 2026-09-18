var _a;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
var base = (_a = process.env.VITE_BASE) !== null && _a !== void 0 ? _a : '/encanto-kids-pedidos/';
export default defineConfig({
    base: base,
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'favicon.svg'],
            manifest: {
                name: 'Pedido de roupas - Encanto Kids',
                short_name: 'Encanto Kids',
                description: 'App para montar pedidos de roupas no celular.',
                theme_color: '#f4f1ea',
                background_color: '#f4f1ea',
                display: 'standalone',
                start_url: './',
                icons: [
                    {
                        src: '/icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
});
