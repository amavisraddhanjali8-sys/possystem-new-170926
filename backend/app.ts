import express from 'express';
import { loadDatabase } from './store';
import { setupViteOrStatic } from './middleware/vite.middleware';

// Route modules
import healthRoutes from './routes/health.routes';
import productsRoutes from './routes/products.routes';
import branchesRoutes from './routes/branches.routes';
import customersRoutes from './routes/customers.routes';
import quotationsRoutes from './routes/quotations.routes';
import transportRoutes from './routes/transport.routes';
import usersRoutes from './routes/users.routes';
import configRoutes from './routes/config.routes';
import databaseRoutes from './routes/database.routes';
import eventsRoutes from './routes/events.routes';

const app = express();
const PORT = 3000;

// Load persistent database from AWS EC2 PostgreSQL
loadDatabase();

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount Domain Routes
app.use(healthRoutes);
app.use(productsRoutes);
app.use(branchesRoutes);
app.use(customersRoutes);
app.use(quotationsRoutes);
app.use(transportRoutes);
app.use(usersRoutes);
app.use(configRoutes);
app.use(databaseRoutes);
app.use(eventsRoutes);

// Unmatched API routes return JSON 404
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

export async function startServer() {
  // Load persistent database from AWS EC2 PostgreSQL
  await loadDatabase();

  // Initialize Vite or static file serving before listening
  await setupViteOrStatic(app);

  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`🚀 Innovista Central ERP backend running on http://0.0.0.0:${PORT}`);
      console.log(`🐘 Relational Storage: AWS EC2 PostgreSQL (Amazon Web Services Elastic Compute Cloud)`);
      console.log(`⚡ Real-time SSE price & quotation broadcasting active`);
      resolve(s);
    });
  });

  return server;
}

export default app;
