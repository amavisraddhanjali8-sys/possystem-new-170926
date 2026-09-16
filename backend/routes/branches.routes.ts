import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { Branch, BranchPriceOverride } from '../../shared/types';

const router = Router();

// Branches CRUD
router.get('/api/branches', (req, res) => {
  res.json(store.branches);
});

router.post('/api/branches', (req, res) => {
  const { name, code, location, manager_name, region, margin_pct } = req.body;
  const newBranch: Branch = {
    id: req.body.id || `b-${Date.now()}`,
    code: code || `BR-${Math.floor(100 + Math.random() * 900)}`,
    name: name || 'New Branch',
    location: location || 'Regional City',
    region: region || 'Western',
    status: 'Online',
    last_sync: 'Just now',
    active_users: 1,
    manager_name: manager_name || 'Branch Manager',
    margin_pct: Number(margin_pct) || 0
  };
  store.branches.push(newBranch);
  saveDatabase();
  res.json(newBranch);
});

router.put('/api/branches/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.branches.findIndex(b => b.id === id || b.code === id);
  if (idx === -1) return res.status(404).json({ error: 'Branch not found' });

  store.branches[idx] = { ...store.branches[idx], ...req.body };
  saveDatabase();
  res.json(store.branches[idx]);
});

router.post('/api/branches/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const branch = store.branches.find(b => b.id === id || b.code === id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  branch.status = status;
  saveDatabase();

  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: status === 'Deactivated' || status === 'Offline' ? '🚨 Branch Node Deactivated' : '✅ Branch Node Reactivated',
    message: `${branch.name} status set to ${status} by Head Office Admin`,
    branch_name: branch.name
  });

  res.json(branch);
});

router.put('/api/branches/:id/margin', (req, res) => {
  const { id } = req.params;
  const { margin_pct } = req.body;

  const branch = store.branches.find(b => b.id === id || b.code === id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  branch.margin_pct = Number(margin_pct);
  saveDatabase();

  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: `📈 Branch Margin Tier Updated`,
    message: `${branch.name} regional margin set to ${branch.margin_pct}% over Head Office cost base`,
    branch_name: branch.name
  });

  res.json(branch);
});

// Branch Price Overrides
router.get('/api/branch-prices', (req, res) => {
  res.json(store.branchPrices);
});

router.post('/api/branch-prices', (req, res) => {
  const { branch_id, product_id, special_price, effective_from, effective_to, notes, created_by } = req.body;
  const prod = store.products.find(p => p.id === product_id || p.product_code === product_id);
  const branch = store.branches.find(b => b.id === branch_id || b.code === branch_id);

  if (!prod || !branch) {
    return res.status(400).json({ error: 'Invalid product or branch ID' });
  }

  const existingIdx = store.branchPrices.findIndex(bp => bp.branch_id === branch.id && bp.product_id === prod.id);
  const newOverride: BranchPriceOverride = {
    id: existingIdx !== -1 ? store.branchPrices[existingIdx].id : `bp-${Date.now()}`,
    branch_id: branch.id,
    branch_code: branch.code,
    branch_name: branch.name,
    product_id: prod.id,
    product_code: prod.product_code,
    special_price: Number(special_price),
    effective_from: effective_from || new Date().toISOString().split('T')[0],
    effective_to: effective_to || undefined,
    created_by: created_by || 'HO Master Admin',
    status: 'Active',
    notes: notes || 'Head Office Branch Override'
  };

  if (existingIdx !== -1) {
    store.branchPrices[existingIdx] = newOverride;
  } else {
    store.branchPrices.unshift(newOverride);
  }

  saveDatabase();

  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: `⚡ Branch Price Override Set: ${branch.code}`,
    message: `${prod.product_code} override updated to Rs. ${Number(special_price).toLocaleString()} for ${branch.name}`,
    product_code: prod.product_code,
    new_price: Number(special_price),
    branch_name: branch.name
  });

  res.json(newOverride);
});

router.delete('/api/branch-prices/:id', (req, res) => {
  const { id } = req.params;
  store.branchPrices = store.branchPrices.filter(bp => bp.id !== id);
  saveDatabase();
  res.json({ success: true, id });
});

export default router;
