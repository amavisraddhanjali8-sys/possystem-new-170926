import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchDatabaseStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/database/stats`);
  return parseJsonResponse<any>(res, 'Failed to fetch database stats');
}

export async function fetchDatabaseBackup(): Promise<any> {
  const res = await fetch(`${API_BASE}/database/backup`);
  return parseJsonResponse<any>(res, 'Failed to download database backup');
}

export async function restoreDatabaseSnapshot(data: any): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/database/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return parseJsonResponse<{ success: boolean; message: string }>(res, 'Failed to restore database');
}

export async function resetDatabaseToDefault(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/database/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return parseJsonResponse<{ success: boolean; message: string }>(res, 'Failed to reset database');
}

export async function fetchDatabaseDiagnostics(): Promise<any> {
  const res = await fetch(`${API_BASE}/database/diagnostics`);
  return parseJsonResponse<any>(res, 'Failed to fetch database diagnostics');
}

export async function testLocalDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE}/database/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return parseJsonResponse<any>(res, 'Failed to test database connection');
}
export const testAwsDatabaseConnection = testLocalDatabase;

export async function syncLocalDatabase(direction: 'push' | 'pull' = 'push'): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/database/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction })
  });
  return parseJsonResponse<{ success: boolean; message: string }>(res, 'Failed to sync database');
}
export const syncAwsDatabase = syncLocalDatabase;
