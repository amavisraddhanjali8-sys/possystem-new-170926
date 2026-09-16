import { Customer, CustomerPriceOverride } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${API_BASE}/customers`);
  return parseJsonResponse<Customer[]>(res, 'Failed to fetch customers');
}

export async function addCustomer(cust: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cust)
  });
  return parseJsonResponse<Customer>(res, 'Failed to create customer');
}

export async function updateCustomer(id: string, cust: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cust)
  });
  return parseJsonResponse<Customer>(res, 'Failed to update customer');
}

export async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer');
}

export async function fetchCustomerPrices(): Promise<CustomerPriceOverride[]> {
  const res = await fetch(`${API_BASE}/customer-prices`);
  return parseJsonResponse<CustomerPriceOverride[]>(res, 'Failed to fetch customer prices');
}

export async function createCustomerPriceOverride(rule: Partial<CustomerPriceOverride>): Promise<CustomerPriceOverride> {
  const res = await fetch(`${API_BASE}/customer-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  return parseJsonResponse<CustomerPriceOverride>(res, 'Failed to create customer price rule');
}

export async function deleteCustomerPriceOverride(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/customer-prices/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer price rule');
}
