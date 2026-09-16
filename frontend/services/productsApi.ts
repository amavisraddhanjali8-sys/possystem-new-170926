import { Product, PriceHistory, PricePriorityResolution } from '../../shared/types';
import { API_BASE, parseJsonResponse } from './apiClient';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`);
  return parseJsonResponse<Product[]>(res, 'Failed to fetch products');
}

export async function resolvePricePriority(
  product_id: string, 
  branch_id?: string, 
  customer_name?: string
): Promise<PricePriorityResolution> {
  const res = await fetch(`${API_BASE}/prices/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id, branch_id, customer_name })
  });
  return parseJsonResponse<PricePriorityResolution>(res, 'Failed to resolve price priority');
}

export async function updateProductPrice(
  id: string, 
  new_price: number, 
  updated_by: string, 
  reason: string, 
  effective_date?: string,
  role?: string,
  branch_affected?: string
): Promise<{ product: Product; history: PriceHistory }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_price, updated_by, reason, effective_date, role, branch_affected })
  });
  return parseJsonResponse<{ product: Product; history: PriceHistory }>(res, 'Failed to update product price');
}

export async function batchUpdateProductPrices(
  items: Array<{ id: string; new_price: number; old_price: number }>,
  updated_by: string,
  reason: string,
  effective_date?: string,
  category?: string,
  supplier?: string
): Promise<{ products: Product[]; history: PriceHistory[] }> {
  const res = await fetch(`${API_BASE}/products/batch-margin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, updated_by, reason, effective_date, category, supplier })
  });
  return parseJsonResponse<{ products: Product[]; history: PriceHistory[] }>(res, 'Failed to execute batch margin update');
}

export async function updateProductMasterData(
  id: string,
  productData: Partial<Product> & { reason?: string; effective_date?: string }
): Promise<{ product: Product; history?: PriceHistory }> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  return parseJsonResponse<{ product: Product; history?: PriceHistory }>(res, 'Failed to update product master data');
}

export async function addProduct(product: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return parseJsonResponse<Product>(res, 'Failed to add product');
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function proposePriceChange(
  id: string, 
  proposed_price: number, 
  proposed_by: string, 
  proposed_reason: string
): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/propose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposed_price, proposed_by, proposed_reason })
  });
  return parseJsonResponse<Product>(res, 'Failed to submit price proposal');
}

export async function approvePriceChange(
  id: string, 
  approved: boolean, 
  approved_by: string
): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, approved_by })
  });
  return parseJsonResponse<Product>(res, 'Failed to process approval');
}

export async function fetchPriceHistory(userRole?: string): Promise<PriceHistory[]> {
  const headers: Record<string, string> = {};
  if (userRole) {
    headers['x-user-role'] = userRole;
  }
  const res = await fetch(`${API_BASE}/prices/history`, { headers });
  return parseJsonResponse<PriceHistory[]>(res, 'Failed to fetch price history');
}
