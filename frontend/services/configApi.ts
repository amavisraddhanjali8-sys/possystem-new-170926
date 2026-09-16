import { CompanySettings, CategoryConfig, CustomerTypeConfig, LocationConfig } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

// Company Profile & Settings
export async function fetchCompanySettings(): Promise<CompanySettings> {
  const res = await fetch(`${API_BASE}/company-settings`);
  return parseJsonResponse<CompanySettings>(res, 'Failed to fetch company settings');
}

export async function updateCompanySettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
  const res = await fetch(`${API_BASE}/company-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return parseJsonResponse<CompanySettings>(res, 'Failed to update company settings');
}

// Categories Management
export async function fetchCategories(): Promise<CategoryConfig[]> {
  const res = await fetch(`${API_BASE}/categories`);
  return parseJsonResponse<CategoryConfig[]>(res, 'Failed to fetch categories');
}

export async function addCategory(cat: Partial<CategoryConfig>): Promise<CategoryConfig> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cat)
  });
  return parseJsonResponse<CategoryConfig>(res, 'Failed to create category');
}

export async function updateCategory(id: string, cat: Partial<CategoryConfig>): Promise<CategoryConfig> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cat)
  });
  return parseJsonResponse<CategoryConfig>(res, 'Failed to update category');
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

// Customer Types Management
export async function fetchCustomerTypes(): Promise<CustomerTypeConfig[]> {
  const res = await fetch(`${API_BASE}/customer-types`);
  return parseJsonResponse<CustomerTypeConfig[]>(res, 'Failed to fetch customer types');
}

export async function addCustomerType(ct: Partial<CustomerTypeConfig>): Promise<CustomerTypeConfig> {
  const res = await fetch(`${API_BASE}/customer-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ct)
  });
  return parseJsonResponse<CustomerTypeConfig>(res, 'Failed to create customer type');
}

export async function updateCustomerType(id: string, ct: Partial<CustomerTypeConfig>): Promise<CustomerTypeConfig> {
  const res = await fetch(`${API_BASE}/customer-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ct)
  });
  return parseJsonResponse<CustomerTypeConfig>(res, 'Failed to update customer type');
}

export async function deleteCustomerType(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/customer-types/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer type');
}

// Location Configs Management
export async function fetchLocationConfigs(): Promise<LocationConfig[]> {
  const res = await fetch(`${API_BASE}/locations-config`);
  return parseJsonResponse<LocationConfig[]>(res, 'Failed to fetch location configs');
}

export async function addLocationConfig(loc: Partial<LocationConfig>): Promise<LocationConfig> {
  const res = await fetch(`${API_BASE}/locations-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loc)
  });
  return parseJsonResponse<LocationConfig>(res, 'Failed to create location config');
}

export async function updateLocationConfig(id: string, loc: Partial<LocationConfig>): Promise<LocationConfig> {
  const res = await fetch(`${API_BASE}/locations-config/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loc)
  });
  return parseJsonResponse<LocationConfig>(res, 'Failed to update location config');
}

export async function deleteLocationConfig(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/locations-config/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete location config');
}
