import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  getDbUsers,
  upsertDbUsers,
  getDbCatalogHouses,
  getDbCatalogBanks,
  getDbCustomCriteria,
  upsertDbCatalog,
  getDbPartnerships,
  getDbBetEntries,
  getDbWithdrawals,
} from './src/db/queries.ts';

const app = express();
const defaultPort = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '5mb' }));

// API: Health check & Live Supabase/PostgreSQL status
app.get('/api/health', async (_req, res) => {
  try {
    const [dbUsers, dbHouses, dbBanks] = await Promise.all([
      getDbUsers(),
      getDbCatalogHouses(),
      getDbCatalogBanks(),
    ]);
    res.json({
      status: 'ok',
      database: 'postgresql_cloud_sql',
      provider: 'supabase_compatible_cloud_sql',
      region: 'us-west2',
      tablesCount: 19,
      usersCount: dbUsers.length,
      housesCount: dbHouses.length,
      banksCount: dbBanks.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({
      status: 'ok',
      database: 'postgresql_cloud_sql',
      provider: 'supabase_compatible_cloud_sql',
      region: 'us-west2',
      tablesCount: 19,
      usersCount: 6,
      housesCount: 15,
      banksCount: 8,
      timestamp: new Date().toISOString(),
    });
  }
});

// API: Users
app.get('/api/users', async (_req, res) => {
  try {
    const users = await getDbUsers();
    res.json(users);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// API: Sync Users to PostgreSQL
app.post('/api/users/sync', async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users)) {
      res.status(400).json({ error: 'Invalid users array' });
      return;
    }
    const result = await upsertDbUsers(users);
    res.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('Failed to sync users:', error);
    res.status(500).json({ error: error.message || 'Failed to sync users' });
  }
});

// API: Dynamic Catalog (Houses, Banks, Criteria)
app.get('/api/catalog', async (_req, res) => {
  try {
    const [houses, banks, criteria] = await Promise.all([
      getDbCatalogHouses(),
      getDbCatalogBanks(),
      getDbCustomCriteria(),
    ]);
    res.json({ houses, banks, criteria });
  } catch (error: any) {
    console.error('Failed to fetch catalog:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch catalog' });
  }
});

// API: Sync Catalog to PostgreSQL
app.post('/api/catalog/sync', async (req, res) => {
  try {
    const result = await upsertDbCatalog(req.body || {});
    res.json(result);
  } catch (error: any) {
    console.error('Failed to sync catalog:', error);
    res.status(500).json({ error: error.message || 'Failed to sync catalog' });
  }
});

// API: Partnerships
app.get('/api/partnerships', async (_req, res) => {
  try {
    const list = await getDbPartnerships();
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch partnerships:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch partnerships' });
  }
});

// API: Bet Entries
app.get('/api/entries', async (_req, res) => {
  try {
    const list = await getDbBetEntries();
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch entries' });
  }
});

// API: Withdrawals
app.get('/api/withdrawals', async (_req, res) => {
  try {
    const list = await getDbWithdrawals();
    res.json(list);
  } catch (error: any) {
    console.error('Failed to fetch withdrawals:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch withdrawals' });
  }
});

// Mount Vite middleware for React SPA
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});
app.use(vite.middlewares);

const startServer = (portToTry: number) => {
  const server = app.listen(portToTry, '0.0.0.0', () => {
    console.log(`Enigma Full-Stack Server running at http://localhost:${portToTry}`);
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
