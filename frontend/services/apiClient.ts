export const API_BASE = '/api';

export async function parseJsonResponse<T>(res: Response, defaultErrorMessage: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${defaultErrorMessage} (Status ${res.status})`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${defaultErrorMessage}: Invalid non-JSON server response`);
  }
  return res.json();
}
