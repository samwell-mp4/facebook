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
            let targetFile = path.join(process.cwd(), decodedUrl);

            // Transparent fallback to .webp if jpg/png was requested
            if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
              if (/\.(jpg|jpeg|png)$/i.test(targetFile)) {
                const webpFile = targetFile.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                if (fs.existsSync(webpFile) && fs.statSync(webpFile).isFile()) {
                  targetFile = webpFile;
                }
              }
            }

            if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
              const ext = path.extname(targetFile).toLowerCase();
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
                fs.createReadStream(targetFile).pipe(res);
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
