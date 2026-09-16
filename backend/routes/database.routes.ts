import { Router } from 'express';
import { 
  store, 
  saveDatabase, 
  resetDatabaseToDefaults 
} from '../store';
import { broadcastEvent } from '../services/sse';
import { 
  getDatabaseDiagnostics, 
  executeRawPostgresQuery, 
  getPostgresDbConfig,
  loadStateFromPostgres
} from '../db';
import { db, pool } from '../../src/db/index.ts';
import * as schema from '../../src/db/schema.ts';
import { 
  syncProductToPostgres, 
  syncQuotationToPostgres, 
  syncCustomerToPostgres, 
  syncUserToPostgres 
} from '../postgresDb';

const router = Router();

// Diagnostics & Status from AWS EC2 PostgreSQL
router.get(['/api/database/status', '/api/database/diagnostics'], async (req, res) => {
  try {
    const diag = await getDatabaseDiagnostics();
    res.json(diag);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Test Connection directly with AWS EC2 PostgreSQL
router.post('/api/database/test', async (req, res) => {
  try {
    const result = await executeRawPostgresQuery('SELECT current_database() as db, current_user as usr, version() as ver, NOW() as server_time');
    const diag = await getDatabaseDiagnostics();
    res.json({
      success: true,
      message: 'AWS EC2 PostgreSQL Database verified and operational',
      connection: result.rows[0],
      diagnostics: diag
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Force Sync with PostgreSQL
router.post('/api/database/sync', async (req, res) => {
  try {
    const refreshed = await loadStateFromPostgres();
    if (refreshed) {
      store.products = refreshed.products;
      store.branches = refreshed.branches;
      store.customers = refreshed.customers;
      store.quotations = refreshed.quotations;
      store.priceHistory = refreshed.priceHistory;
      store.vehicles = refreshed.vehicles;
      store.systemUsers = refreshed.systemUsers;
    }
    const diag = await getDatabaseDiagnostics();
    return res.json({
      success: true,
      message: `AWS EC2 PostgreSQL successfully synchronized (${diag.totalRecords} records across all tables).`,
      diagnostics: diag
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

// PostgreSQL Database Stats
router.get('/api/database/stats', async (req, res) => {
  try {
    const diag = await getDatabaseDiagnostics();
    const config = getPostgresDbConfig();
    res.json({
      status: 'healthy',
      engine: 'AWS EC2 Linux Instance (Self-Hosted PostgreSQL Relational Engine)',
      db_status: diag.status,
      database: config.database,
      host: config.host,
      user: config.user,
      last_sync: diag.lastSyncTime,
      total_records: diag.totalRecords,
      record_counts: diag.tableCounts
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve database stats: ' + err.message });
  }
});

// Execute SQL Query Runner against AWS EC2 PostgreSQL
router.post(['/api/database/query', '/api/database/postgres/query', '/api/database/sqlite/query'], async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing SQL query parameter' });
    }

    const trimmed = query.trim();
    const startTime = Date.now();

    // Prevent dangerous operations
    if (/DROP\s+DATABASE|DROP\s+USER/i.test(trimmed)) {
      return res.status(403).json({ error: 'Prohibited SQL operation: Cannot drop database or user' });
    }

    const result = await executeRawPostgresQuery(trimmed);
    const durationMs = Date.now() - startTime;

    return res.json({
      success: true,
      engine: 'AWS EC2 PostgreSQL',
      rowCount: result.rowCount,
      command: result.command,
      executionTimeMs: durationMs,
      rows: result.rows
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Download PostgreSQL SQL Dump Script (.sql)
router.get(['/api/database/download/postgres', '/api/database/download/sql'], async (req, res) => {
  try {
    let script = `-- ==================================================================\n`;
    script += `-- INNOVISTA AWS EC2 POSTGRESQL DATABASE EXPORT\n`;
    script += `-- Generated: ${new Date().toISOString()}\n`;
    script += `-- Engine: AWS EC2 Linux Instance (Amazon Elastic Compute Cloud - PostgreSQL)\n`;
    script += `-- ==================================================================\n\n`;

    const prods = await db.select().from(schema.products);
    for (const p of prods) {
      script += `INSERT INTO products (id, product_code, product_name, category, current_price, base_price, unit, status) VALUES ('${p.id.replace(/'/g, "''")}', '${p.product_code.replace(/'/g, "''")}', '${p.product_name.replace(/'/g, "''")}', '${(p.category || '').replace(/'/g, "''")}', ${p.current_price || 0}, ${p.base_price || 0}, '${p.unit || 'PCS'}', '${p.status || 'Active'}') ON CONFLICT (id) DO NOTHING;\n`;
    }

    const bList = await db.select().from(schema.branches);
    for (const b of bList) {
      script += `INSERT INTO branches (id, branch_code, branch_name, location, is_head_office, default_margin_percent, status) VALUES ('${b.id.replace(/'/g, "''")}', '${b.branch_code.replace(/'/g, "''")}', '${b.branch_name.replace(/'/g, "''")}', '${(b.location || '').replace(/'/g, "''")}', ${b.is_head_office ? 'TRUE' : 'FALSE'}, ${b.default_margin_percent || 15}, '${b.status || 'Active'}') ON CONFLICT (id) DO NOTHING;\n`;
    }

    const cList = await db.select().from(schema.customers);
    for (const c of cList) {
      script += `INSERT INTO customers (id, name, email, phone, tier, total_spent, status) VALUES ('${c.id.replace(/'/g, "''")}', '${c.name.replace(/'/g, "''")}', '${(c.email || '').replace(/'/g, "''")}', '${(c.phone || '').replace(/'/g, "''")}', '${c.tier || 'Standard'}', ${c.total_spent || 0}, '${c.status || 'Active'}') ON CONFLICT (id) DO NOTHING;\n`;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="innovista-aws-postgresql.sql"');
    res.send(script);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate PostgreSQL script: ' + err.message });
  }
});

// Download Full JSON Database Snapshot (.json)
router.get(['/api/database/download/json', '/api/database/backup'], async (req, res) => {
  try {
    const backupData = await loadStateFromPostgres();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="innovista-postgresql-export-${Date.now()}.json"`);
    res.json(backupData || store);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to download JSON database: ' + err.message });
  }
});

// Restore Database into PostgreSQL
router.post('/api/database/restore', async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid database snapshot object' });
    }

    if (Array.isArray(data.products)) {
      store.products = data.products;
      for (const p of data.products) await syncProductToPostgres(p);
    }
    if (Array.isArray(data.customers)) {
      store.customers = data.customers;
      for (const c of data.customers) await syncCustomerToPostgres(c);
    }
    if (Array.isArray(data.quotations)) {
      store.quotations = data.quotations;
      for (const q of data.quotations) await syncQuotationToPostgres(q);
    }
    if (Array.isArray(data.systemUsers)) {
      store.systemUsers = data.systemUsers;
      for (const u of data.systemUsers) await syncUserToPostgres(u);
    }

    saveDatabase();

    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '🔄 PostgreSQL Database Restored',
      message: 'AWS EC2 PostgreSQL database state successfully restored and synchronized.',
      branch_name: 'All Branches'
    });

    res.json({ success: true, message: 'AWS EC2 PostgreSQL database state successfully restored' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to restore database: ' + err.message });
  }
});

// Power BI Live Relational Ingestion Feed (Web API / OData style)
router.get('/api/database/powerbi/feed', (req, res) => {
  try {
    const flattenedItems: any[] = [];
    (store.quotations || []).forEach(q => {
      (q.items || []).forEach(item => {
        flattenedItems.push({
          item_id: item.id,
          quotation_id: q.id,
          quotation_number: q.quotation_number,
          branch_id: q.branch_id,
          branch_name: q.branch_name,
          date: q.date,
          customer_name: q.customer_name,
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          category: item.category || 'Uncategorized',
          unit: item.unit || 'PCS',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          unit_weight_kg: item.weight_kg || 0
        });
      });
    });

    const powerBiPayload = {
      system: "Innovista Enterprise Relational Warehouse (AWS EC2 PostgreSQL)",
      version: "3.0",
      exported_at: new Date().toISOString(),
      summary: {
        total_quotations: store.quotations.length,
        total_line_items: flattenedItems.length,
        total_products: store.products.length,
        total_branches: store.branches.length,
        total_customers: store.customers.length,
        total_gross_revenue: store.quotations.reduce((acc, q) => acc + (q.net_total || 0), 0)
      },
      quotations: store.quotations.map(q => ({
        id: q.id,
        quotation_number: q.quotation_number,
        branch_id: q.branch_id,
        branch_name: q.branch_name,
        branch_code: q.branch_code || '',
        customer_name: q.customer_name,
        customer_phone: q.customer_phone,
        status: q.status,
        date: q.date,
        valid_until: q.valid_until,
        material_subtotal: q.material_subtotal || 0,
        fabrication_cost: q.fabrication_cost || 0,
        installation_cost: q.installation_cost || 0,
        transport_cost: q.transport_cost || 0,
        subtotal: q.subtotal || 0,
        discount_amount: q.discount_amount || 0,
        tax_amount: q.tax_amount || 0,
        net_total: q.net_total || 0,
        created_by: q.created_by || 'Sales',
        validated_by: q.validated_by || null,
        site_location_name: q.site_location_name || '',
        site_address: q.site_address || ''
      })),
      quotation_items: flattenedItems,
      products: store.products.map(p => ({
        id: p.id,
        product_code: p.product_code,
        product_name: p.product_name,
        category: p.category,
        sub_category: p.sub_category,
        supplier: p.supplier,
        base_price: p.base_price,
        current_price: p.current_price,
        unit: p.unit,
        status: p.status
      })),
      branches: store.branches.map(b => ({
        id: b.id,
        code: b.code,
        name: b.name,
        manager_name: b.manager_name,
        location: b.location,
        region: b.region,
        status: b.status
      })),
      customers: store.customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        customer_type: c.customer_type,
        district_region: c.district_region
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.json(powerBiPayload);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate Power BI feed: ' + err.message });
  }
});

// Reset Database
router.post('/api/database/reset', (req, res) => {
  try {
    resetDatabaseToDefaults();

    broadcastEvent({
      type: 'PRICE_UPDATE',
      title: '⚠️ PostgreSQL Database Reset',
      message: 'AWS EC2 PostgreSQL database reset to factory default state by system admin.',
      branch_name: 'Head Office'
    });

    res.json({ success: true, message: 'Database successfully reset to default factory state' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

export default router;
