import { startServer } from './backend/app';

startServer().catch((err) => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});
