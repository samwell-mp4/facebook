import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-perfume-images',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            const rawPath = req.url.split('?')[0];
            const decodedUrl = decodeURIComponent(rawPath);
            const possibleFile = path.join(process.cwd(), decodedUrl);

            if (fs.existsSync(possibleFile) && fs.statSync(possibleFile).isFile()) {
              const ext = path.extname(possibleFile).toLowerCase();
              const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml'
              };
              if (mimeTypes[ext]) {
                res.setHeader('Content-Type', mimeTypes[ext]);
                res.setHeader('Cache-Control', 'max-age=86400, public');
                fs.createReadStream(possibleFile).pipe(res);
                return;
              }
            }
          } catch (e) {
            // continue
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
