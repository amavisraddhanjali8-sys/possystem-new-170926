import { Quotation, DiscountApprovalRequest } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchQuotations(): Promise<Quotation[]> {
  const res = await fetch(`${API_BASE}/quotations`);
  return parseJsonResponse<Quotation[]>(res, 'Failed to fetch quotations');
}

export async function createQuotation(quotation: Partial<Quotation>): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quotation)
  });
  return parseJsonResponse<Quotation>(res, 'Failed to create quotation');
}

export async function validateQuotation(
  id: string, 
  validated_by: string, 
  external_software_ref?: string, 
  validation_notes?: string
): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/quotations/${id}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ validated_by, external_software_ref, validation_notes })
  });
  return parseJsonResponse<Quotation>(res, 'Failed to validate quotation');
}

export async function fetchDiscountRequests(): Promise<DiscountApprovalRequest[]> {
  const res = await fetch(`${API_BASE}/discount-requests`);
  return parseJsonResponse<DiscountApprovalRequest[]>(res, 'Failed to fetch discount requests');
}

export async function createDiscountRequest(req: Partial<DiscountApprovalRequest>): Promise<DiscountApprovalRequest> {
  const res = await fetch(`${API_BASE}/discount-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  return parseJsonResponse<DiscountApprovalRequest>(res, 'Failed to create discount approval request');
}

export async function approveDiscountRequest(
  id: string, 
  approved: boolean, 
  reviewed_by?: string, 
  notes?: string
): Promise<DiscountApprovalRequest> {
  const res = await fetch(`${API_BASE}/discount-requests/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, reviewed_by, notes })
  });
  return parseJsonResponse<DiscountApprovalRequest>(res, 'Failed to process discount approval');
}

export async function updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/quotations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return parseJsonResponse<Quotation>(res, 'Failed to update quotation');
}

export async function deleteQuotation(id: string, deleted_by?: string, role?: string, remark?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/quotations/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted_by, role, remark })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete quotation (Status ${res.status})`);
  }
}

export async function requestOrderRemoval(
  id: string, 
  reason: string, 
  requested_by: string, 
  requested_role: string
): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/quotations/${id}/request-removal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, requested_by, requested_role })
  });
  return parseJsonResponse<Quotation>(res, 'Failed to submit order removal request');
}

export async function rejectOrderRemoval(id: string, rejected_by: string, role?: string): Promise<Quotation> {
  const res = await fetch(`${API_BASE}/quotations/${id}/reject-removal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejected_by, role })
  });
  return parseJsonResponse<Quotation>(res, 'Failed to reject order removal request');
}
