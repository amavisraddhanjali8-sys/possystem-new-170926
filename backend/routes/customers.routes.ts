import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { Customer, CustomerPriceOverride } from '../../shared/types';
import { syncCustomerToPostgres, deleteCustomerFromPostgres } from '../postgresDb';

const router = Router();

// Customer Management Database API
router.get('/api/customers', (req, res) => {
  res.json(store.customers);
});

router.post('/api/customers', (req, res) => {
  const newCust: Customer = {
    id: req.body.id || `cust-${Date.now()}`,
    name: req.body.name || 'New Client',
    phone: req.body.phone || '',
    email: req.body.email || '',
    address: req.body.address || '',
    district_region: req.body.district_region || 'Colombo',
    customer_type: req.body.customer_type || 'Retail Customer',
    tax_id: req.body.tax_id || '',
    discount_tier_pct: Number(req.body.discount_tier_pct) || 0,
    created_at: new Date().toISOString().split('T')[0]
  };
  store.customers.unshift(newCust);
  saveDatabase();
  syncCustomerToPostgres(newCust);
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '👤 Customer Account Registered',
    message: `Customer ${newCust.name} (${newCust.customer_type}) added to customer master database`,
    branch_name: newCust.district_region || 'Central'
  });
  res.json(newCust);
});

router.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.customers.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.customers[idx] = { ...store.customers[idx], ...req.body };
    saveDatabase();
    syncCustomerToPostgres(store.customers[idx]);
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '✏️ Customer Profile Updated',
      message: `Customer profile ${store.customers[idx].name} updated in master database`,
      branch_name: store.customers[idx].district_region || 'Central'
    });
    res.json(store.customers[idx]);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

router.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  store.customers = store.customers.filter(c => c.id !== id);
  saveDatabase();
  deleteCustomerFromPostgres(id);
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ Customer Account Removed',
    message: `Customer account ${id} removed from database`,
    branch_name: 'Central'
  });
  res.json({ success: true, id });
});

// Customer Price Rules API
router.get('/api/customer-prices', (req, res) => {
  res.json(store.customerPrices);
});

router.post('/api/customer-prices', (req, res) => {
  const { customer_name, product_id, product_name, special_price, discount_pct, contract_mode, quantity_tiers, effective_from, effective_to, notes, created_by } = req.body;
  const prod = store.products.find(p => p.id === product_id || p.product_code === product_id);

  if (!prod || !customer_name) {
    return res.status(400).json({ error: 'Invalid product or customer name' });
  }

  const newRule: CustomerPriceOverride = {
    id: `cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customer_name,
    product_id: prod.id,
    product_code: prod.product_code,
    product_name: product_name || prod.product_name,
    special_price: Number(special_price),
    discount_pct: discount_pct ? Number(discount_pct) : undefined,
    contract_mode: contract_mode || 'fixed_price',
    quantity_tiers: Array.isArray(quantity_tiers) ? quantity_tiers : undefined,
    effective_from: effective_from || new Date().toISOString().split('T')[0],
    effective_to: effective_to || undefined,
    created_by: created_by || 'HO Master Admin',
    notes: notes || 'Customer Negotiated Contract Rate'
  };

  store.customerPrices.unshift(newRule);
  saveDatabase();

  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: `🎯 Customer Contract Price Added`,
    message: `Special rate of Rs. ${Number(special_price).toLocaleString()} for ${customer_name} on ${prod.product_code}`,
    product_code: prod.product_code,
    new_price: Number(special_price),
    branch_name: 'All Branches'
  });

  res.json(newRule);
});

router.delete('/api/customer-prices/:id', (req, res) => {
  const { id } = req.params;
  store.customerPrices = store.customerPrices.filter(cp => cp.id !== id);
  saveDatabase();
  res.json({ success: true, id });
});

export default router;
