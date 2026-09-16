import { Branch, BranchPriceOverride } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchBranches(): Promise<Branch[]> {
  const res = await fetch(`${API_BASE}/branches`);
  return parseJsonResponse<Branch[]>(res, 'Failed to fetch branches');
}

export async function updateBranchMargin(branchId: string, margin_pct: number): Promise<Branch> {
  const res = await fetch(`${API_BASE}/branches/${branchId}/margin`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ margin_pct })
  });
  return parseJsonResponse<Branch>(res, 'Failed to update branch margin');
}

export async function fetchBranchPrices(): Promise<BranchPriceOverride[]> {
  const res = await fetch(`${API_BASE}/branch-prices`);
  return parseJsonResponse<BranchPriceOverride[]>(res, 'Failed to fetch branch prices');
}

export async function createBranchPriceOverride(override: Partial<BranchPriceOverride>): Promise<BranchPriceOverride> {
  const res = await fetch(`${API_BASE}/branch-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(override)
  });
  return parseJsonResponse<BranchPriceOverride>(res, 'Failed to create branch price override');
}

export async function deleteBranchPriceOverride(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/branch-prices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete branch price override');
}
