import { Vehicle, TransportRules, SiteLocation, TransportCalculationInput, TransportCalculationResult } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`);
  return parseJsonResponse<Vehicle[]>(res, 'Failed to fetch vehicles');
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return parseJsonResponse<Vehicle>(res, 'Failed to update vehicle');
}

export async function fetchTransportRules(): Promise<TransportRules> {
  const res = await fetch(`${API_BASE}/transport/rules`);
  return parseJsonResponse<TransportRules>(res, 'Failed to fetch transport rules');
}

export async function updateTransportRules(rules: Partial<TransportRules>): Promise<TransportRules> {
  const res = await fetch(`${API_BASE}/transport/rules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rules)
  });
  return parseJsonResponse<TransportRules>(res, 'Failed to update transport rules');
}

export async function fetchLocations(): Promise<SiteLocation[]> {
  const res = await fetch(`${API_BASE}/locations`);
  return parseJsonResponse<SiteLocation[]>(res, 'Failed to fetch locations');
}

export async function calculateTransport(input: TransportCalculationInput): Promise<TransportCalculationResult> {
  const res = await fetch(`${API_BASE}/transport/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  return parseJsonResponse<TransportCalculationResult>(res, 'Failed to calculate transport');
}
