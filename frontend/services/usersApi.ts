import { SystemUser } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchUsers(requesterRole?: string): Promise<SystemUser[]> {
  const headers: Record<string, string> = {};
  if (requesterRole) {
    headers['x-user-role'] = requesterRole;
  }
  const url = requesterRole 
    ? `${API_BASE}/users?requester_role=${encodeURIComponent(requesterRole)}`
    : `${API_BASE}/users`;
  const res = await fetch(url, { headers });
  return parseJsonResponse<SystemUser[]>(res, 'Failed to fetch system users');
}

export async function addUser(user: Partial<SystemUser>, creatorRole?: string): Promise<SystemUser> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (creatorRole) {
    headers['x-user-role'] = creatorRole;
  }
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(creatorRole ? { ...user, creator_role: creatorRole } : user)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create user account');
  }
  return res.json();
}

export async function updateUser(id: string, data: Partial<SystemUser>, editorRole?: string): Promise<SystemUser> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (editorRole) {
    headers['x-user-role'] = editorRole;
  }
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(editorRole ? { ...data, editor_role: editorRole } : data)
  });
  return parseJsonResponse<SystemUser>(res, 'Failed to update user');
}

export async function updateUserStatus(id: string, status: 'Active' | 'Pending Approval' | 'Deactivated', requesterRole?: string): Promise<SystemUser> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requesterRole) {
    headers['x-user-role'] = requesterRole;
  }
  const res = await fetch(`${API_BASE}/users/${id}/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status, requester_role: requesterRole })
  });
  return parseJsonResponse<SystemUser>(res, 'Failed to update user status');
}

export async function deleteUser(id: string, requesterRole?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (requesterRole) {
    headers['x-user-role'] = requesterRole;
  }
  const url = requesterRole 
    ? `${API_BASE}/users/${id}?requester_role=${encodeURIComponent(requesterRole)}`
    : `${API_BASE}/users/${id}`;
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to delete user');
  }
}

export async function updateUserPassword(id: string, new_password: string): Promise<SystemUser> {
  const res = await fetch(`${API_BASE}/users/${id}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password })
  });
  return parseJsonResponse<SystemUser>(res, 'Failed to update password');
}

export async function criticalLogin(identifier: string, pin: string): Promise<{ success: boolean; user: SystemUser; message: string }> {
  const res = await fetch(`${API_BASE}/auth/critical-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, pin })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to authenticate critical circumstances emergency PIN');
  }
  return res.json();
}

