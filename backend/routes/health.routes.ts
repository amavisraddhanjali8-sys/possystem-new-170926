import { Router } from 'express';

const router = Router();

router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Innovista Central ERP Master API', timestamp: new Date().toISOString() });
});

export default router;
