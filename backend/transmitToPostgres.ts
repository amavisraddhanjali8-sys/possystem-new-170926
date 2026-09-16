import fs from 'fs';
import path from 'path';
import { db } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import {
  INITIAL_PRODUCTS,
  INITIAL_PRICE_HISTORY,
  INITIAL_BRANCHES,
  INITIAL_VEHICLES,
  INITIAL_TRANSPORT_RULES,
  INITIAL_LOCATIONS,
  INITIAL_QUOTATIONS,
  INITIAL_BRANCH_PRICES,
  INITIAL_CUSTOMER_PRICES,
  INITIAL_DISCOUNT_REQUESTS,
  INITIAL_CUSTOMERS,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMER_TYPES,
  INITIAL_LOCATION_CONFIGS
} from './data/initialData';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export async function transmitAllDataToPostgres() {
  console.log('🚀 Starting PostgreSQL transmission of all databases...');

  // 1. Load data from db.json or fallback to SQLite or defaults
  let data: any = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      data = JSON.parse(raw);
      console.log('📄 Loaded data from db.json');
    } catch (e) {
      console.error('Error reading db.json:', e);
    }
  }

  if (!data) {
    console.log('ℹ️ Using initial enterprise data seed for transmission');
  }

  const productsList = (data?.products?.length ? data.products : INITIAL_PRODUCTS) || [];
  const branchesList = (data?.branches?.length ? data.branches : INITIAL_BRANCHES) || [];
  const customersList = (data?.customers?.length ? data.customers : INITIAL_CUSTOMERS) || [];
  const quotationsList = (data?.quotations?.length ? data.quotations : INITIAL_QUOTATIONS) || [];
  const priceHistoryList = (data?.priceHistory?.length ? data.priceHistory : INITIAL_PRICE_HISTORY) || [];
  const vehiclesList = (data?.vehicles?.length ? data.vehicles : INITIAL_VEHICLES) || [];
  const transportRulesObj = data?.transportRules || INITIAL_TRANSPORT_RULES;
  const locationsList = (data?.locations?.length ? data.locations : INITIAL_LOCATIONS) || [];
  const branchPricesList = (data?.branchPrices?.length ? data.branchPrices : INITIAL_BRANCH_PRICES) || [];
  const customerPricesList = (data?.customerPrices?.length ? data.customerPrices : INITIAL_CUSTOMER_PRICES) || [];
  const discountRequestsList = (data?.discountRequests?.length ? data.discountRequests : INITIAL_DISCOUNT_REQUESTS) || [];
  const systemUsersList = (data?.systemUsers?.length ? data.systemUsers : INITIAL_USERS) || [];
  const companySettingsObj = data?.companySettings || INITIAL_COMPANY_SETTINGS;
  const categoriesList = (data?.categories?.length ? data.categories : INITIAL_CATEGORIES) || [];
  const customerTypesList = (data?.customerTypes?.length ? data.customerTypes : INITIAL_CUSTOMER_TYPES) || [];
  const locationConfigsList = (data?.locationConfigs?.length ? data.locationConfigs : INITIAL_LOCATION_CONFIGS) || [];

  // Transmit Branches
  for (const b of branchesList) {
    await db.insert(schema.branches)
      .values({
        id: b.id || `b-${b.branch_code || Date.now()}`,
        branch_code: b.branch_code || b.code || `BR-${b.id}`,
        branch_name: b.branch_name || b.name || 'Branch',
        location: b.location || b.region || '',
        city: b.city || '',
        address: b.address || '',
        phone: b.phone || '',
        email: b.email || '',
        is_head_office: Boolean(b.is_head_office || b.is_main_branch),
        default_margin_percent: Number(b.default_margin_percent ?? b.default_margin_pct ?? 15),
        manager_name: b.manager_name || '',
        status: b.status || (b.is_active !== false ? 'Active' : 'Inactive'),
        settings: b.settings || null,
        created_at: b.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${branchesList.length} branches to PostgreSQL`);

  // Transmit Products
  for (const p of productsList) {
    const basePrice = Number(p.base_price ?? p.current_price ?? 0);
    await db.insert(schema.products)
      .values({
        id: p.id || `p-${p.product_code || Date.now()}`,
        product_code: p.product_code || `PRD-${p.id}`,
        product_name: p.product_name || 'Product',
        category: p.category || '',
        sub_category: p.sub_category || '',
        brand: p.brand || p.supplier || '',
        current_price: Number(p.current_price ?? basePrice),
        base_price: basePrice,
        cost_price: Number(p.cost_price ?? Math.round(basePrice * 0.8)),
        min_selling_price: Number(p.min_selling_price ?? Math.round(basePrice * 0.9)),
        unit: p.unit || 'PCS',
        display_method: p.price_display_method || p.display_method || 'Standard',
        pricing_tier: p.pricing_tier || '',
        customer_type: p.customer_type || '',
        region_zone: p.region_zone || '',
        project_type: p.project_type || '',
        material_grade: p.material_grade || '',
        material_thickness: p.material_thickness || '',
        material_finish: p.material_finish || '',
        material_colour: p.material_colour || '',
        glass_type: p.glass_type || '',
        installation_option: p.installation_option || '',
        discount_method: p.discount_method || '',
        status: p.status || 'Active',
        stock_quantity: Number(p.stock_quantity ?? 0),
        reorder_level: Number(p.reorder_level ?? 0),
        image_url: p.image_url || p.images?.[0]?.url || '',
        notes: p.notes || p.description || '',
        main_material_spec: p.main_material_spec || null,
        glass_spec: p.glass_spec || null,
        hardware_specs: p.hardware_specs || p.hardware_specs_list || null,
        custom_materials: p.custom_materials || null,
        quantity_breaks: p.quantity_breaks || null,
        price_breakdown: p.price_breakdown || null,
        branch_allocations: p.branch_allocations || null,
        tags: p.tags || null,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.last_updated || p.updated_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${productsList.length} products to PostgreSQL`);

  // Transmit Customers
  for (const c of customersList) {
    await db.insert(schema.customers)
      .values({
        id: c.id || `cust-${Date.now()}`,
        name: c.name || c.customer_name || 'Customer',
        email: c.email || '',
        phone: c.phone || '',
        company: c.company || '',
        customer_type: c.customer_type || '',
        tier: c.tier || 'Standard',
        rating: Number(c.rating ?? 5),
        total_orders: Number(c.total_orders ?? 0),
        total_spent: Number(c.total_spent ?? 0),
        credit_limit: Number(c.credit_limit ?? 0),
        outstanding_balance: Number(c.outstanding_balance ?? 0),
        address: c.address || '',
        city: c.city || '',
        status: c.status || 'Active',
        created_at: c.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${customersList.length} customers to PostgreSQL`);

  // Transmit System Users
  for (const u of systemUsersList) {
    await db.insert(schema.systemUsers)
      .values({
        id: u.id || `usr-${Date.now()}`,
        uid: u.uid || null,
        employee_id: u.employee_id || '',
        full_name: u.full_name || u.name || 'System User',
        username: u.username || u.email || '',
        email: u.email || '',
        password: u.password || '',
        role: u.role || 'Staff',
        branch_id: u.branch_id || '',
        branch_name: u.branch_name || '',
        phone: u.phone || '',
        status: u.status || 'Active',
        critical_pin: u.critical_pin || null,
        mfa_enabled: Boolean(u.mfa_enabled),
        mfa_secret: u.mfa_secret || null,
        mfa_backup_codes: u.mfa_backup_codes || null,
        permissions: u.permissions || null,
        auth_audit_logs: u.authAuditLogs || u.auth_audit_logs || null,
        last_login: u.last_login || null,
        created_at: u.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${systemUsersList.length} system users to PostgreSQL`);

  // Transmit Quotations
  for (const q of quotationsList) {
    await db.insert(schema.quotations)
      .values({
        id: q.id || `qt-${Date.now()}`,
        quotation_number: q.quotation_number || `QT-${q.id}`,
        customer_name: q.customer_name || 'Client',
        customer_id: q.customer_id || '',
        customer_phone: q.customer_phone || '',
        customer_email: q.customer_email || '',
        branch_id: q.branch_id || '',
        branch_name: q.branch_name || '',
        status: q.status || 'Draft',
        subtotal: Number(q.subtotal ?? q.material_subtotal ?? 0),
        transport_fee: Number(q.transport_fee ?? q.transport_cost ?? 0),
        discount_amount: Number(q.discount_amount ?? 0),
        tax_amount: Number(q.tax_amount ?? 0),
        total_amount: Number(q.total_amount ?? q.net_total ?? 0),
        validity_date: q.validity_date || q.valid_until || '',
        created_by: q.created_by || '',
        created_at: q.created_at || q.date || new Date().toISOString(),
        updated_at: q.updated_at || new Date().toISOString(),
        items: q.items || null,
        notes: q.notes || '',
        site_location: q.site_location || { address: q.site_address, location_name: q.site_location_name }
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${quotationsList.length} quotations to PostgreSQL`);

  // Transmit Price History
  for (const ph of priceHistoryList) {
    await db.insert(schema.priceHistory)
      .values({
        id: ph.id || `ph-${Date.now()}`,
        product_id: ph.product_id || '',
        product_code: ph.product_code || '',
        product_name: ph.product_name || '',
        old_price: Number(ph.old_price ?? 0),
        new_price: Number(ph.new_price ?? 0),
        change_percent: Number(ph.change_percent ?? 0),
        change_type: ph.change_type || ph.update_type || '',
        effective_date: ph.effective_date || ph.changed_date || '',
        reason: ph.reason || '',
        changed_by: ph.changed_by || '',
        branch_id: ph.branch_id || ph.branch_affected || '',
        created_at: ph.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${priceHistoryList.length} price history entries to PostgreSQL`);

  // Transmit Vehicles
  for (const v of vehiclesList) {
    await db.insert(schema.vehicles)
      .values({
        id: v.id || `veh-${Date.now()}`,
        registration_no: v.registration_no || v.reg_no || '',
        vehicle_type: v.vehicle_type || v.name || 'Truck',
        fuel_type: v.fuel_type || 'Diesel',
        capacity_tons: Number(v.capacity_tons ?? 1),
        cost_per_km: Number(v.cost_per_km ?? 150),
        driver_allowance: Number(v.driver_allowance ?? 1500),
        is_active: v.is_active !== false,
        max_load_capacity: Number(v.max_load_capacity ?? 1000)
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${vehiclesList.length} vehicles to PostgreSQL`);

  // Transmit Transport Rules
  await db.insert(schema.transportRules)
    .values({
      id: 'default-transport-rules',
      base_transport_fee: Number(transportRulesObj.base_transport_fee ?? 2500),
      per_km_rate: Number(transportRulesObj.per_km_rate ?? 160),
      free_delivery_threshold: Number(transportRulesObj.free_delivery_threshold ?? 200000),
      heavy_vehicle_surcharge: Number(transportRulesObj.heavy_vehicle_surcharge ?? 5000),
      rules_json: transportRulesObj,
      updated_at: new Date().toISOString()
    })
    .onConflictDoNothing();
  console.log(`✅ Transmitted transport rules to PostgreSQL`);

  // Transmit Locations
  for (const loc of locationsList) {
    await db.insert(schema.locations)
      .values({
        id: loc.id || `loc-${Date.now()}`,
        name: loc.name || 'Location',
        province: loc.province || '',
        district: loc.district || '',
        distance_from_colombo_km: Number(loc.distance_from_colombo_km ?? loc.distance_km ?? 0),
        base_fee: Number(loc.base_fee ?? 2500),
        is_active: loc.is_active !== false
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${locationsList.length} locations to PostgreSQL`);

  // Transmit Branch Prices
  for (const bp of branchPricesList) {
    await db.insert(schema.branchPrices)
      .values({
        id: bp.id || `bp-${Date.now()}`,
        product_id: bp.product_id || '',
        product_code: bp.product_code || '',
        branch_id: bp.branch_id || '',
        branch_code: bp.branch_code || '',
        special_price: Number(bp.special_price ?? 0),
        margin_percent: Number(bp.margin_percent ?? 0),
        effective_from: bp.effective_from || '',
        effective_to: bp.effective_to || '',
        status: bp.status || 'Active',
        created_at: bp.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${branchPricesList.length} branch prices to PostgreSQL`);

  // Transmit Customer Prices
  for (const cp of customerPricesList) {
    await db.insert(schema.customerPrices)
      .values({
        id: cp.id || `cp-${Date.now()}`,
        customer_name: cp.customer_name || '',
        customer_id: cp.customer_id || '',
        product_id: cp.product_id || '',
        product_code: cp.product_code || '',
        special_price: Number(cp.special_price ?? 0),
        discount_percent: Number(cp.discount_percent ?? 0),
        effective_from: cp.effective_from || '',
        effective_to: cp.effective_to || '',
        created_at: cp.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${customerPricesList.length} customer prices to PostgreSQL`);

  // Transmit Discount Requests
  for (const dr of discountRequestsList) {
    await db.insert(schema.discountRequests)
      .values({
        id: dr.id || `dr-${Date.now()}`,
        quotation_id: dr.quotation_id || '',
        quotation_number: dr.quotation_number || '',
        requested_by: dr.requested_by || '',
        customer_name: dr.customer_name || '',
        original_amount: Number(dr.original_amount ?? 0),
        requested_discount_percent: Number(dr.requested_discount_percent ?? 0),
        proposed_amount: Number(dr.proposed_amount ?? 0),
        reason: dr.reason || '',
        status: dr.status || 'Pending',
        approved_by: dr.approved_by || '',
        approved_at: dr.approved_at || '',
        created_at: dr.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${discountRequestsList.length} discount requests to PostgreSQL`);

  // Transmit Company Settings
  await db.insert(schema.companySettings)
    .values({
      id: 'default-company-settings',
      company_name: companySettingsObj.company_name || 'Innovista Aluminium & Glass',
      tag_line: companySettingsObj.tag_line || '',
      address: companySettingsObj.address || '',
      city: companySettingsObj.city || '',
      phone: companySettingsObj.phone || '',
      email: companySettingsObj.email || '',
      website: companySettingsObj.website || '',
      tax_no: companySettingsObj.tax_no || '',
      logo_url: companySettingsObj.logo_url || '',
      currency: companySettingsObj.currency || 'LKR',
      quotation_terms: companySettingsObj.quotation_terms || '',
      email_settings: companySettingsObj.email_settings || null,
      updated_at: new Date().toISOString()
    })
    .onConflictDoNothing();
  console.log(`✅ Transmitted company settings to PostgreSQL`);

  // Transmit Categories
  for (const cat of categoriesList) {
    await db.insert(schema.categories)
      .values({
        id: cat.id || `cat-${Date.now()}`,
        name: cat.name || '',
        code: cat.code || '',
        description: cat.description || '',
        icon: cat.icon || '',
        is_active: cat.is_active !== false
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${categoriesList.length} categories to PostgreSQL`);

  // Transmit Customer Types
  for (const ct of customerTypesList) {
    await db.insert(schema.customerTypes)
      .values({
        id: ct.id || `ct-${Date.now()}`,
        name: ct.name || '',
        code: ct.code || '',
        default_discount_percent: Number(ct.default_discount_percent ?? 0),
        description: ct.description || ''
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${customerTypesList.length} customer types to PostgreSQL`);

  // Transmit Location Configs
  for (const lc of locationConfigsList) {
    await db.insert(schema.locationConfigs)
      .values({
        id: lc.id || `lc-${Date.now()}`,
        province: lc.province || '',
        district: lc.district || '',
        zone: lc.zone || '',
        transport_rate_multiplier: Number(lc.transport_rate_multiplier ?? 1.0)
      })
      .onConflictDoNothing();
  }
  console.log(`✅ Transmitted ${locationConfigsList.length} location configs to PostgreSQL`);

  console.log('🎉 Complete transmission of all databases to PostgreSQL finished successfully!');
  return true;
}

if (process.argv[1] && process.argv[1].includes('transmitToPostgres')) {
  transmitAllDataToPostgres()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during PostgreSQL transmission:', err);
      process.exit(1);
    });
}
