import { RealTimeEvent } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchRecentEvents(): Promise<RealTimeEvent[]> {
  const res = await fetch(`${API_BASE}/events/recent`);
  return parseJsonResponse<RealTimeEvent[]>(res, 'Failed to fetch events');
}

export function subscribeToRealTimeEvents(onEvent: (event: RealTimeEvent) => void): () => void {
  const eventSource = new EventSource('/api/events/stream');

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data && data.type !== 'CONNECTED') {
        onEvent(data);
      }
    } catch (err) {
      console.error('SSE JSON parse error:', err);
    }
  };

  eventSource.onerror = () => {
    // Retry logic handled automatically by EventSource
  };

  return () => {
    eventSource.close();
  };
}
