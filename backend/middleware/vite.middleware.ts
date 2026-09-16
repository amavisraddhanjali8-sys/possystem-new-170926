import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

export async function setupViteOrStatic(app: Express): Promise<void> {
  // Support legacy /src/assets and /frontend/assets path routing for images/logos
  const frontendAssets = path.join(process.cwd(), 'frontend', 'assets');
  if (fs.existsSync(frontendAssets)) {
    app.use('/frontend/assets', express.static(frontendAssets));
    app.use('/src/assets', express.static(frontendAssets));
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

