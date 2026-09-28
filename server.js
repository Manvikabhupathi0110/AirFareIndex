import express from 'express';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    app: 'airfare-v30-local',
    timestamp: new Date().toISOString(),
    db: process.env.DATABASE_URL ? 'configured' : 'not-configured'
  });
});

app.use(express.static(path.join(__dirname, 'public')));

const apiRoot = path.join(__dirname, 'api');

function routeFromFile(filePath) {
  const relative = path.relative(apiRoot, filePath).replace(/\\/g, '/');
  const withoutExt = relative.replace(/\.js$/, '');

  if (withoutExt === 'v1-index') return '/api/v1/index';
  if (withoutExt === 'v1-metadata') return '/api/v1/metadata';
  if (withoutExt === 'v1-traceability') return '/api/v1/traceability';
  if (withoutExt === 'v1/[resource]') return '/api/v1/:resource';
  const route = withoutExt.startsWith('v1/') ? `/api/${withoutExt}` : `/api/${withoutExt}`;
  return route;
}

function registerApiRoutes(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      registerApiRoutes(fullPath, `${prefix}/${entry.name}`);
      continue;
    }
    if (!entry.name.endsWith('.js')) continue;

    const route = routeFromFile(fullPath);
    const importPath = `file://${fullPath}`;

    app.all(route, async (req, res) => {
      try {
        const mod = await import(importPath);
        if (!mod.default || typeof mod.default !== 'function') {
          return res.status(500).json({ error: 'API module does not export a default handler.' });
        }
        return mod.default(req, res);
      } catch (error) {
        console.error(`API route failed: ${route}`, error);
        return res.status(500).json({
          error: 'Local backend route execution failed.',
          details: error.message,
          route
        });
      }
    });
  }
}

registerApiRoutes(apiRoot);

app.get('*', (req, res) => {
  const rootPath = path.join(__dirname, 'public', 'index.html');
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found', path: req.path });
  }
  if (fs.existsSync(rootPath)) {
    return res.sendFile(rootPath);
  }
  res.status(404).send('Not found');
});

app.listen(port, () => {
  console.log(`Local AirFare backend running at http://localhost:${port}`);
  console.log(`Health endpoint: http://localhost:${port}/health`);
});
