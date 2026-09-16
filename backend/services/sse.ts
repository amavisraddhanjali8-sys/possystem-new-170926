import express from 'express';
import { RealTimeEvent } from '../../shared/types';

export const eventFeed: RealTimeEvent[] = [
  {
    id: 'evt-001',
    timestamp: new Date().toLocaleTimeString(),
    type: 'PRICE_UPDATE',
    title: 'Master Persistent Database Online',
    message: 'Persistent File Database online. All changes are saved directly to storage.',
    product_code: 'SYS',
    old_price: 0,
    new_price: 0,
    branch_name: 'All Branches'
  }
];

// Active SSE client connections
const sseClients: express.Response[] = [];

export function broadcastEvent(event: Omit<RealTimeEvent, 'id' | 'timestamp'>): void {
  const fullEvent: RealTimeEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    ...event
  };
  eventFeed.unshift(fullEvent);
  if (eventFeed.length > 50) eventFeed.pop();

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(fullEvent)}\n\n`);
    } catch {
      // Ignore client write errors
    }
  });
}

export function addSseClient(res: express.Response): void {
  sseClients.push(res);
}

export function removeSseClient(res: express.Response): void {
  const idx = sseClients.indexOf(res);
  if (idx !== -1) {
    sseClients.splice(idx, 1);
  }
}
