import { Router } from 'express';
import { eventFeed, addSseClient, removeSseClient } from '../services/sse';

const router = Router();

// SSE Real-Time Price Broadcast & Audit Log Stream
router.get('/api/events/recent', (req, res) => {
  res.json(eventFeed.slice(0, 30));
});

router.get('/api/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  addSseClient(res);

  // Send initial connected payload
  res.write(`data: ${JSON.stringify({
    id: `init-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    type: 'CONNECTED',
    title: 'SSE Synchronized',
    message: 'Connected to Innovista Central ERP SSE Event Hub',
    branch_name: 'All Branches'
  })}\n\n`);

  req.on('close', () => {
    removeSseClient(res);
  });
});

export default router;
