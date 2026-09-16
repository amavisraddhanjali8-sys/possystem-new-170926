import http from 'http';

interface TestResult {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function request(options: {
  path: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string; json: any }> {
  return new Promise((resolve, reject) => {
    const data = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: options.path,
        method: options.method || 'GET',
        headers: {
          ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // Not JSON
          }
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: raw,
            json: parsed,
          });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, category, status: 'PASS', durationMs: Date.now() - start });
    console.log(`  ✅ [PASS] ${category} > ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, category, status: 'FAIL', details: err.message, durationMs: Date.now() - start });
    console.error(`  ❌ [FAIL] ${category} > ${name} (${Date.now() - start}ms): ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive System & Database Diagnostics...\n');

  // Wait for server readiness
  for (let i = 0; i < 20; i++) {
    try {
      const res = await request({ path: '/api/health' });
      if (res.statusCode === 200) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // ==========================================
  // 1. Core Health & Server
  // ==========================================
  console.log('--- 1. Health & Server Endpoints ---');
  await runTest('Server', 'GET /api/health', async () => {
    const res = await request({ path: '/api/health' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (res.json?.status !== 'ok') throw new Error(`Expected status 'ok', got: ${JSON.stringify(res.json)}`);
  });

  // ==========================================
  // 2. Database Diagnostics & Queries
  // ==========================================
  console.log('\n--- 2. Database & AWS EC2 PostgreSQL Verification ---');
  await runTest('Database', 'GET /api/database/status', async () => {
    const res = await request({ path: '/api/database/status' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (!res.json?.isConnected) throw new Error(`Database reported disconnected: ${JSON.stringify(res.json)}`);
  });

  await runTest('Database', 'GET /api/database/stats', async () => {
    const res = await request({ path: '/api/database/stats' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (res.json?.status !== 'healthy') throw new Error(`Expected healthy, got: ${res.json?.status}`);
    if (typeof res.json?.total_records !== 'number' || res.json.total_records < 1) {
      throw new Error(`Invalid total records count: ${res.json?.total_records}`);
    }
  });

  await runTest('Database', 'POST /api/database/test', async () => {
    const res = await request({ path: '/api/database/test', method: 'POST' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (!res.json?.success) throw new Error(`Test connection failed: ${JSON.stringify(res.json)}`);
    if (!res.json?.connection?.ver) throw new Error('Missing PostgreSQL version info in connection test');
  });

  await runTest('Database', 'POST /api/database/query (PostgreSQL Version & Tables)', async () => {
    const res = await request({
      path: '/api/database/query',
      method: 'POST',
      body: { query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (!res.json?.success) throw new Error(`Query failed: ${JSON.stringify(res.json)}`);
    if (!Array.isArray(res.json?.rows) || res.json.rows.length === 0) {
      throw new Error('No tables returned from information_schema');
    }
  });

  await runTest('Database', 'POST /api/database/sync', async () => {
    const res = await request({ path: '/api/database/sync', method: 'POST' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (!res.json?.success) throw new Error(`Sync failed: ${JSON.stringify(res.json)}`);
  });

  await runTest('Database', 'GET /api/database/download/postgres', async () => {
    const res = await request({ path: '/api/database/download/postgres' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!res.body.includes('AWS EC2 POSTGRESQL DATABASE EXPORT')) {
      throw new Error('PostgreSQL export dump missing expected header');
    }
  });

  await runTest('Database', 'GET /api/database/download/json', async () => {
    const res = await request({ path: '/api/database/download/json' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json?.products)) throw new Error('JSON backup missing products list');
  });

  await runTest('Database', 'GET /api/database/powerbi/feed', async () => {
    const res = await request({ path: '/api/database/powerbi/feed' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json?.products)) throw new Error('PowerBI feed missing products payload');
    if (!res.json?.summary?.total_quotations !== undefined && typeof res.json?.summary?.total_products !== 'number') {
      throw new Error('PowerBI feed missing summary object');
    }
  });

  // ==========================================
  // 3. Entity REST Endpoints
  // ==========================================
  console.log('\n--- 3. Entity REST API Endpoints ---');

  await runTest('Products', 'GET /api/products', async () => {
    const res = await request({ path: '/api/products' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of products');
  });

  await runTest('Products', 'POST /api/prices/resolve', async () => {
    const prods = await request({ path: '/api/products' });
    const p = prods.json[0];
    const res = await request({
      path: '/api/prices/resolve',
      method: 'POST',
      body: { product_id: p.id, branch_id: 'b-cmb', customer_name: 'Access Engineering PLC' },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (typeof res.json?.final_price !== 'number' || res.json.final_price <= 0) {
      throw new Error(`Price not resolved: ${JSON.stringify(res.json)}`);
    }
  });

  await runTest('Products', 'GET /api/prices/history', async () => {
    const res = await request({ path: '/api/prices/history' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of price history');
  });

  await runTest('Branches', 'GET /api/branches', async () => {
    const res = await request({ path: '/api/branches' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of branches');
  });

  await runTest('Branches', 'GET /api/branch-prices', async () => {
    const res = await request({ path: '/api/branch-prices' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of branch prices');
  });

  await runTest('Customers', 'GET /api/customers', async () => {
    const res = await request({ path: '/api/customers' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of customers');
  });

  await runTest('Customers', 'GET /api/customer-prices', async () => {
    const res = await request({ path: '/api/customer-prices' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of customer prices');
  });

  await runTest('Quotations', 'GET /api/quotations', async () => {
    const res = await request({ path: '/api/quotations' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of quotations');
  });

  await runTest('Quotations', 'GET /api/discount-requests', async () => {
    const res = await request({ path: '/api/discount-requests' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of discount requests');
  });

  await runTest('Users', 'GET /api/users', async () => {
    const res = await request({ path: '/api/users' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of system users');
  });

  await runTest('Transport', 'GET /api/vehicles', async () => {
    const res = await request({ path: '/api/vehicles' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of vehicles');
  });

  await runTest('Transport', 'GET /api/transport/rules', async () => {
    const res = await request({ path: '/api/transport/rules' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (typeof res.json?.fuel_price_per_l !== 'number') throw new Error('Expected transport rules object');
  });

  await runTest('Transport', 'GET /api/locations', async () => {
    const res = await request({ path: '/api/locations' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of site locations');
  });

  await runTest('Transport', 'POST /api/transport/calculate', async () => {
    const res = await request({
      path: '/api/transport/calculate',
      method: 'POST',
      body: { location_id: 'loc-kandy', total_weight_kg: 250, custom_distance_km: 115 },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (typeof res.json?.total_transport_cost !== 'number' || res.json.total_transport_cost <= 0) {
      throw new Error('Expected numeric total_transport_cost calculation');
    }
  });

  await runTest('Configuration', 'GET /api/company-settings', async () => {
    const res = await request({ path: '/api/company-settings' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!res.json?.company_name) throw new Error('Expected company_name in settings');
  });

  await runTest('Configuration', 'GET /api/categories', async () => {
    const res = await request({ path: '/api/categories' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of categories');
  });

  await runTest('Configuration', 'GET /api/customer-types', async () => {
    const res = await request({ path: '/api/customer-types' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of customer types');
  });

  await runTest('Configuration', 'GET /api/locations-config', async () => {
    const res = await request({ path: '/api/locations-config' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json) || res.json.length === 0) throw new Error('Expected array of locations-config');
  });

  await runTest('Events', 'GET /api/events/recent', async () => {
    const res = await request({ path: '/api/events/recent' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!Array.isArray(res.json)) throw new Error('Expected array of recent events');
  });

  // ==========================================
  // 4. End-to-End Database CRUD Cycle
  // ==========================================
  console.log('\n--- 4. End-to-End Relational CRUD Cycle ---');
  const nowSuffix = Date.now();
  const testProdId = `test-prod-${nowSuffix}`;
  const testProdCode = `TEST-${nowSuffix.toString().slice(-6)}`;

  await runTest('CRUD', 'Create Product (POST /api/products)', async () => {
    const res = await request({
      path: '/api/products',
      method: 'POST',
      body: {
        id: testProdId,
        product_code: testProdCode,
        product_name: 'Automated Diagnostic Test Profile Bar',
        category: 'Aluminium Profiles',
        current_price: 9990,
        base_price: 9990,
        unit: 'bar',
        status: 'Active',
      },
    });
    if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (res.json?.id !== testProdId) throw new Error(`Expected product ID ${testProdId}, got ${res.json?.id}`);
  });

  await runTest('CRUD', 'Verify Product in Database (Query API)', async () => {
    const res = await request({
      path: '/api/database/query',
      method: 'POST',
      body: { query: `SELECT id, product_code, current_price FROM products WHERE id = '${testProdId}';` },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (res.json?.rows?.length !== 1) throw new Error(`Expected 1 row in DB, found ${res.json?.rows?.length}`);
    if (Number(res.json.rows[0].current_price) !== 9990) throw new Error(`Mismatch price: ${res.json.rows[0].current_price}`);
  });

  await runTest('CRUD', 'Update Product (PUT /api/products/:id)', async () => {
    const res = await request({
      path: `/api/products/${testProdId}`,
      method: 'PUT',
      body: {
        product_name: 'Automated Diagnostic Test Profile Bar (Updated)',
        current_price: 11500,
      },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const actualPrice = res.json?.product?.current_price ?? res.json?.current_price;
    if (actualPrice !== 11500) throw new Error(`Expected updated price 11500, got ${actualPrice}`);
  });

  await runTest('CRUD', 'Delete Product (DELETE /api/products/:id)', async () => {
    const res = await request({
      path: `/api/products/${testProdId}`,
      method: 'DELETE',
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    if (!res.json?.success) throw new Error(`Delete failed: ${JSON.stringify(res.json)}`);
  });

  await runTest('CRUD', 'Verify Deletion from Database', async () => {
    const res = await request({
      path: '/api/database/query',
      method: 'POST',
      body: { query: `SELECT id FROM products WHERE id = '${testProdId}';` },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (res.json?.rows?.length !== 0) throw new Error(`Expected 0 rows in DB, found ${res.json?.rows?.length}`);
  });

  // ==========================================
  // 5. Frontend Delivery & SPA HTML
  // ==========================================
  console.log('\n--- 5. Frontend & Static Assets ---');
  await runTest('Frontend', 'GET / (Index HTML & SPA Entrypoint)', async () => {
    const res = await request({ path: '/' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!res.body.includes('<div id="root">') && !res.body.includes('id="root"')) {
      throw new Error('Index HTML does not contain root container');
    }
    if (!res.body.includes('/src/main.tsx') && !res.body.includes('main.')) {
      throw new Error('Index HTML missing main entrypoint script');
    }
  });

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n==========================================');
  console.log('🏁 TEST SUITE SUMMARY');
  console.log('==========================================');
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Total Tests Run : ${results.length}`);
  console.log(`Passed          : ${passed}`);
  console.log(`Failed          : ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    for (const f of results.filter((r) => r.status === 'FAIL')) {
      console.log(`  - ${f.category} > ${f.name}: ${f.details}`);
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ALL DATABASE, BACKEND ROUTES, AND FRONTEND TESTS PASSED CLEANLY WITH ZERO ERRORS!');
  }
}

main().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
