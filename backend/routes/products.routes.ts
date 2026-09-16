import { Router } from 'express';
import { store, saveDatabase, resolvePricePriority } from '../store';
import { broadcastEvent } from '../services/sse';
import { Product, PriceHistory } from '../../shared/types';
import { syncProductToPostgres, deleteProductFromPostgres, syncPriceHistoryToPostgres } from '../postgresDb';

const router = Router();

// Price Priority Resolver Endpoint
router.post('/api/prices/resolve', (req, res) => {
  const { product_id, branch_id, customer_name } = req.body;
  const resolution = resolvePricePriority(product_id, branch_id, customer_name);
  res.json(resolution);
});

// Products API
router.get('/api/products', (req, res) => {
  res.json(store.products);
});

router.post('/api/products', async (req, res) => {
  try {
    const pCode = (req.body.product_code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
    const basePrice = Number(req.body.base_price !== undefined ? req.body.base_price : (req.body.current_price || 0));

    const newProd: Product = {
      ...req.body,
      id: req.body.id || `p-${Date.now()}`,
      product_code: pCode,
      product_name: req.body.product_name || 'New Product Item',
      category: req.body.category || 'Aluminium Profiles',
      sub_category: req.body.sub_category || '',
      unit: req.body.unit || 'm²',
      price_display_method: req.body.price_display_method || 'Standard',
      current_price: basePrice,
      base_price: basePrice,
      cost_price: Number(req.body.cost_price !== undefined ? req.body.cost_price : Math.round(basePrice * 0.8)),
      min_selling_price: Number(req.body.min_selling_price !== undefined ? req.body.min_selling_price : Math.round(basePrice * 0.9)),
      unit_weight_kg: Number(req.body.unit_weight_kg) || 1.0,
      status: req.body.status || 'Active',
      effective_date: req.body.effective_date || new Date().toISOString().split('T')[0],
      last_updated: new Date().toLocaleString(),
      updated_by: req.body.updated_by || 'HO Master Admin',
      description: req.body.description || ''
    };

    store.products.unshift(newProd);
    saveDatabase();
    await syncProductToPostgres(newProd);

    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '📦 New Product Registered',
      message: `${newProd.product_code} (${newProd.product_name}) added at base price Rs. ${(newProd.current_price ?? newProd.base_price ?? 0).toLocaleString()}`,
      product_code: newProd.product_code,
      new_price: newProd.current_price,
      branch_name: 'Head Office'
    });

    res.status(201).json(newProd);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product: ' + (err?.message || 'Server error') });
  }
});

router.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.products.findIndex(p => 
      p.id === id || 
      p.product_code === id || 
      p.id.toLowerCase() === targetId || 
      p.product_code.toLowerCase() === targetId
    );
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const existing = store.products[idx];
    const oldPrice = existing.current_price || existing.base_price || 0;
    
    let newPrice = oldPrice;
    if (req.body.new_price !== undefined) {
      newPrice = Number(req.body.new_price);
    } else if (req.body.base_price !== undefined) {
      newPrice = Number(req.body.base_price);
    } else if (req.body.current_price !== undefined) {
      newPrice = Number(req.body.current_price);
    }

    const updatedProduct: Product = {
      ...existing,
      ...req.body,
      current_price: newPrice,
      base_price: req.body.base_price !== undefined ? Number(req.body.base_price) : newPrice,
      cost_price: req.body.cost_price !== undefined ? Number(req.body.cost_price) : existing.cost_price,
      min_selling_price: req.body.min_selling_price !== undefined ? Number(req.body.min_selling_price) : existing.min_selling_price,
      old_price: newPrice !== oldPrice ? oldPrice : existing.old_price,
      last_updated: new Date().toLocaleString(),
      updated_by: req.body.updated_by || existing.updated_by || 'HO Master Admin'
    };

    store.products[idx] = updatedProduct;

    let historyEntry: PriceHistory | undefined;
    if (newPrice !== oldPrice) {
      const priceDiff = newPrice - oldPrice;
      const diffPct = oldPrice > 0 ? (((priceDiff / oldPrice) * 100) || 0).toFixed(1) : '0.0';
      historyEntry = {
        id: `ph-${Date.now()}`,
        entity_type: 'PRICE',
        update_type: 'PRICE_CHANGE',
        product_id: updatedProduct.id,
        product_code: updatedProduct.product_code,
        product_name: updatedProduct.product_name,
        old_price: oldPrice,
        new_price: newPrice,
        changed_by: req.body.updated_by || 'HO Master Admin',
        changed_by_role: req.body.role || req.body.updated_by_role || 'Super Admin',
        changed_date: new Date().toLocaleString(),
        reason: req.body.reason || 'Master price and specification update',
        branch_affected: req.body.branch_affected || 'All Branches',
        change_summary: `Adjusted master price Rs. ${oldPrice.toLocaleString()} → Rs. ${newPrice.toLocaleString()} (${priceDiff > 0 ? '+' : ''}Rs. ${priceDiff.toLocaleString()}, ${diffPct}%)`
      };
      store.priceHistory.unshift(historyEntry);

      broadcastEvent({
        type: 'PRICE_UPDATE',
        title: '⚡ Master Price Changed',
        message: `${updatedProduct.product_code} base price changed: Rs. ${(oldPrice ?? 0).toLocaleString()} → Rs. ${(newPrice ?? 0).toLocaleString()}`,
        product_code: updatedProduct.product_code,
        old_price: oldPrice,
        new_price: newPrice,
        branch_name: 'All Branches'
      });
    }

    saveDatabase();
    await syncProductToPostgres(updatedProduct);
    if (historyEntry) await syncPriceHistoryToPostgres(historyEntry);

    res.json({ product: updatedProduct, history: historyEntry });
  } catch (err: any) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product: ' + (err?.message || 'Server error') });
  }
});

router.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const deletedProduct = store.products.find(p => p.id === id || p.product_code === id);
  store.products = store.products.filter(p => p.id !== id && p.product_code !== id);
  saveDatabase();
  await deleteProductFromPostgres(id);
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ Product Deleted',
    message: `Product ${deletedProduct ? deletedProduct.product_code : id} removed from catalog database`,
    product_code: deletedProduct?.product_code,
    branch_name: 'Head Office'
  });
  res.json({ success: true, id });
});

// Propose Price Change API
router.post('/api/products/:id/propose', (req, res) => {
  try {
    const { id } = req.params;
    const { proposed_price, proposed_by, proposed_reason } = req.body;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.products.findIndex(p => 
      p.id === id || 
      p.product_code === id || 
      p.id.toLowerCase() === targetId || 
      p.product_code.toLowerCase() === targetId
    );
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const prod = store.products[idx];
    prod.proposed_price = Number(proposed_price) || prod.current_price;
    prod.proposed_by = proposed_by || 'Branch Estimator';
    prod.proposed_reason = proposed_reason || 'Branch special price change proposal';
    prod.status = 'Pending Approval';
    prod.last_updated = new Date().toLocaleString();

    saveDatabase();

    broadcastEvent({
      type: 'PRICE_PROPOSAL',
      title: '📋 Price Change Proposed',
      message: `${prod.proposed_by} proposed new price Rs. ${(prod.proposed_price ?? 0).toLocaleString()} for ${prod.product_code} (${prod.product_name})`,
      product_code: prod.product_code,
      new_price: prod.proposed_price,
      branch_name: 'Branch'
    });

    res.json(prod);
  } catch (err: any) {
    console.error('Error submitting price proposal:', err);
    res.status(500).json({ error: 'Failed to submit price proposal: ' + (err?.message || 'Server error') });
  }
});

// Approve or Reject Price Change API
router.post('/api/products/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const { approved, approved_by } = req.body;
    const targetId = (id || '').trim().toLowerCase();
    const idx = store.products.findIndex(p => 
      p.id === id || 
      p.product_code === id || 
      p.id.toLowerCase() === targetId || 
      p.product_code.toLowerCase() === targetId
    );
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const prod = store.products[idx];
    const isApproved = approved === true;
    const approver = approved_by || 'HO Master Admin';

    if (isApproved && prod.proposed_price !== undefined) {
      const oldPrice = prod.current_price || prod.base_price || 0;
      const newPrice = prod.proposed_price;

      prod.old_price = oldPrice;
      prod.current_price = newPrice;
      prod.base_price = newPrice;
      prod.status = 'Active';
      prod.last_updated = new Date().toLocaleString();
      prod.updated_by = approver;

      const priceDiff = newPrice - oldPrice;
      const historyEntry: PriceHistory = {
        id: `ph-${Date.now()}`,
        entity_type: 'PRICE',
        update_type: 'PRICE_CHANGE',
        product_id: prod.id,
        product_code: prod.product_code,
        product_name: prod.product_name,
        old_price: oldPrice,
        new_price: newPrice,
        changed_by: approver,
        changed_by_role: req.body.role || req.body.approver_role || 'Super Admin',
        changed_date: new Date().toLocaleString(),
        reason: prod.proposed_reason ? `Approved Proposal: ${prod.proposed_reason}` : 'Approved Proposed Price Change',
        branch_affected: 'All Branches',
        change_summary: `Approved proposal: Rs. ${oldPrice.toLocaleString()} → Rs. ${newPrice.toLocaleString()} (${priceDiff > 0 ? '+' : ''}Rs. ${priceDiff.toLocaleString()})`
      };
      store.priceHistory.unshift(historyEntry);

      broadcastEvent({
        type: 'PRICE_UPDATE',
        title: '✅ Proposed Price Approved',
        message: `${approver} approved price change for ${prod.product_code}: Rs. ${(newPrice ?? 0).toLocaleString()}`,
        product_code: prod.product_code,
        old_price: oldPrice,
        new_price: newPrice,
        branch_name: 'Head Office'
      });
    } else {
      prod.status = 'Active';
      broadcastEvent({
        type: 'PRICE_PROPOSAL',
        title: '❌ Proposed Price Rejected',
        message: `Proposed price for ${prod.product_code} was rejected by ${approver}`,
        product_code: prod.product_code,
        branch_name: 'Head Office'
      });
    }

    prod.proposed_price = undefined;
    prod.proposed_by = undefined;
    prod.proposed_reason = undefined;

    saveDatabase();

    res.json(prod);
  } catch (err: any) {
    console.error('Error approving price change:', err);
    res.status(500).json({ error: 'Failed to process price approval: ' + (err?.message || 'Server error') });
  }
});

// Batch Margin Update API
router.post('/api/products/batch-margin', (req, res) => {
  const { items, updated_by, reason } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Invalid items payload' });

  const updatedProducts: Product[] = [];
  const newHistoryEntries: PriceHistory[] = [];

  items.forEach(item => {
    const idx = store.products.findIndex(p => p.id === item.id || p.product_code === item.id);
    if (idx !== -1) {
      const oldPrice = store.products[idx].current_price;
      const newPrice = Number(item.new_price);

      store.products[idx].old_price = oldPrice;
      store.products[idx].current_price = newPrice;
      store.products[idx].base_price = newPrice;
      store.products[idx].last_updated = new Date().toLocaleString();
      store.products[idx].updated_by = updated_by || 'HO Master Admin';

      updatedProducts.push(store.products[idx]);

      const priceDiff = newPrice - oldPrice;
      const h: PriceHistory = {
        id: `ph-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        entity_type: 'PRICE',
        update_type: 'PRICE_CHANGE',
        product_id: store.products[idx].id,
        product_code: store.products[idx].product_code,
        product_name: store.products[idx].product_name,
        old_price: oldPrice,
        new_price: newPrice,
        changed_by: updated_by || 'HO Master Admin',
        changed_by_role: req.body.role || req.body.updated_by_role || 'Super Admin',
        changed_date: new Date().toLocaleString(),
        reason: reason || 'Batch Margin Adjustment Push',
        branch_affected: 'All Branches',
        change_summary: `Batch margin adjustment: Rs. ${oldPrice.toLocaleString()} → Rs. ${newPrice.toLocaleString()} (${priceDiff > 0 ? '+' : ''}Rs. ${priceDiff.toLocaleString()})`
      };
      store.priceHistory.unshift(h);
      newHistoryEntries.push(h);
    }
  });

  saveDatabase();

  broadcastEvent({
    type: 'BATCH_MARGIN_PUSH',
    title: '🚀 Batch Margin Adjustment Deployed',
    message: `Pushed new price updates to ${updatedProducts.length} items across all regional nodes.`,
    branch_name: 'All Branches'
  });

  res.json({ products: updatedProducts, history: newHistoryEntries });
});

// Price & Quotation History Audit Logs API - Strictly Super Admin Authorized
router.get(['/api/prices/history', '/api/price-history'], (req, res) => {
  const requesterRole = (req.headers['x-user-role'] || req.headers['requesterrole'] || req.query.role) as string;
  if (requesterRole && requesterRole !== 'Super Admin' && requesterRole !== 'HO MASTER') {
    return res.status(403).json({ error: 'Access Denied: Master Price & Quotation Audit Log is strictly restricted to Super Admin only.' });
  }
  res.json(store.priceHistory);
});

export default router;
