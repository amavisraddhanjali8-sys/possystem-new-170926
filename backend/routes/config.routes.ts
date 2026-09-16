import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { CategoryConfig, CustomerTypeConfig, LocationConfig } from '../../shared/types';

const router = Router();

// Company Settings API
router.get('/api/company-settings', (req, res) => {
  res.json(store.companySettings);
});

router.post('/api/company-settings', (req, res) => {
  store.companySettings = { ...store.companySettings, ...req.body };
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '⚙️ Company Profile & Settings Updated',
    message: `Enterprise master settings updated by administrator`,
    branch_name: 'Head Office'
  });
  res.json(store.companySettings);
});

// Category Taxonomy API
router.get('/api/categories', (req, res) => {
  res.json(store.categories);
});

router.post('/api/categories', (req, res) => {
  const newCat: CategoryConfig = {
    id: req.body.id || `cat-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || '',
    status: req.body.status || 'Active',
    subcategories: req.body.subcategories || []
  };
  store.categories.unshift(newCat);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '📁 Category Created',
    message: `New category ${newCat.name} configured in master taxonomy`,
    branch_name: 'Head Office'
  });
  res.json(newCat);
});

router.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.categories.findIndex(c => c.id === id);
  if (idx !== -1) {
    store.categories[idx] = { ...store.categories[idx], ...req.body };
    saveDatabase();
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '📁 Category Updated',
      message: `Taxonomy category ${store.categories[idx].name} updated`,
      branch_name: 'Head Office'
    });
    res.json(store.categories[idx]);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

router.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  store.categories = store.categories.filter(c => c.id !== id);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ Category Deleted',
    message: `Taxonomy category ${id} removed`,
    branch_name: 'Head Office'
  });
  res.json({ success: true, id });
});

// Customer Types API
router.get('/api/customer-types', (req, res) => {
  res.json(store.customerTypes);
});

router.post('/api/customer-types', (req, res) => {
  const newCt: CustomerTypeConfig = {
    id: req.body.id || `ct-${Date.now()}`,
    name: req.body.name,
    default_discount_pct: Number(req.body.default_discount_pct) || 0,
    description: req.body.description || ''
  };
  store.customerTypes.unshift(newCt);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🏷️ Customer Tier Added',
    message: `Customer tier ${newCt.name} configured`,
    branch_name: 'Head Office'
  });
  res.json(newCt);
});

router.put('/api/customer-types/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.customerTypes.findIndex(ct => ct.id === id);
  if (idx !== -1) {
    store.customerTypes[idx] = { ...store.customerTypes[idx], ...req.body };
    saveDatabase();
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '🏷️ Customer Tier Updated',
      message: `Customer tier ${store.customerTypes[idx].name} updated`,
      branch_name: 'Head Office'
    });
    res.json(store.customerTypes[idx]);
  } else {
    res.status(404).json({ error: 'Customer type not found' });
  }
});

router.delete('/api/customer-types/:id', (req, res) => {
  const { id } = req.params;
  store.customerTypes = store.customerTypes.filter(ct => ct.id !== id);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ Customer Tier Removed',
    message: `Customer tier ${id} deleted`,
    branch_name: 'Head Office'
  });
  res.json({ success: true, id });
});

// Location Configurations API
router.get(['/api/locations-config', '/api/location-configs'], (req, res) => {
  res.json(store.locationConfigs);
});

router.post(['/api/locations-config', '/api/location-configs'], (req, res) => {
  const newLoc: LocationConfig = {
    id: req.body.id || `loc-${Date.now()}`,
    name: req.body.name,
    district: req.body.district || 'Colombo',
    region: req.body.region || 'Western Province',
    status: req.body.status || 'Active'
  };
  store.locationConfigs.unshift(newLoc);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '📍 Location Zone Configured',
    message: `Location zone ${newLoc.name} added`,
    branch_name: 'Head Office'
  });
  res.json(newLoc);
});

router.put(['/api/locations-config/:id', '/api/location-configs/:id'], (req, res) => {
  const { id } = req.params;
  const idx = store.locationConfigs.findIndex(l => l.id === id);
  if (idx !== -1) {
    store.locationConfigs[idx] = { ...store.locationConfigs[idx], ...req.body };
    saveDatabase();
    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '📍 Location Zone Updated',
      message: `Location zone ${store.locationConfigs[idx].name} updated`,
      branch_name: 'Head Office'
    });
    res.json(store.locationConfigs[idx]);
  } else {
    res.status(404).json({ error: 'Location config not found' });
  }
});

router.delete(['/api/locations-config/:id', '/api/location-configs/:id'], (req, res) => {
  const { id } = req.params;
  store.locationConfigs = store.locationConfigs.filter(l => l.id !== id);
  saveDatabase();
  broadcastEvent({
    type: 'PRICE_UPDATE',
    title: '🗑️ Location Zone Removed',
    message: `Location zone ${id} deleted`,
    branch_name: 'Head Office'
  });
  res.json({ success: true, id });
});

export default router;
