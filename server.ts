import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const defaultPort = Number(process.env.PORT) || 3001;

// The production API is intentionally unavailable until authentication,
// authorization, validation, and audited Supabase handlers are integrated.
app.use('/api', (_req, res) => {
  res.status(503).json({
    status: 'offline',
    code: 'BACKEND_NOT_CONFIGURED',
    message: 'A persistência conectada ainda não está configurada.',
  });
});

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});
app.use(vite.middlewares);

const startServer = (portToTry: number) => {
  const server = app.listen(portToTry, '127.0.0.1', () => {
    console.log(`Enigma demo running at http://127.0.0.1:${portToTry}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(defaultPort === 3000 ? 3001 : defaultPort);
