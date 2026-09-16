import { eq } from 'drizzle-orm';
import { db, pool } from '../src/db/index.ts';
import * as schema from '../src/db/schema.ts';
import {
  Product,
  Branch,
  Customer,
  Quotation,
  PriceHistory,
  Vehicle,
  TransportRules,
  SiteLocation,
  BranchPriceOverride,
  CustomerPriceOverride,
  DiscountApprovalRequest,
  SystemUser,
  CompanySettings,
  CategoryConfig,
  CustomerTypeConfig,
  LocationConfig
} from '../shared/types';

export interface PostgresDiagnostics {
  provider: string;
  engine: string;
  status: 'STABLE_POSTGRES' | 'DEGRADED';
  isConnected: boolean;
  database: string;
  host: string;
  user: string;
  tableCounts: Record<string, number>;
  totalRecords: number;
  lastSyncTime: string;
  uptimeSeconds: number;
}

const serverStartTime = Date.now();
let lastSyncTime = new Date().toISOString();

export async function loadAllFromPostgres() {
  try {
    const [
      productsRows,
      branchesRows,
      customersRows,
      quotationsRows,
      priceHistoryRows,
      vehiclesRows,
      transportRulesRows,
      locationsRows,
      branchPricesRows,
      customerPricesRows,
      discountRequestsRows,
      systemUsersRows,
      companySettingsRows,
      categoriesRows,
      customerTypesRows,
      locationConfigsRows
    ] = await Promise.all([
      db.select().from(schema.products),
      db.select().from(schema.branches),
      db.select().from(schema.customers),
      db.select().from(schema.quotations),
      db.select().from(schema.priceHistory),
      db.select().from(schema.vehicles),
      db.select().from(schema.transportRules),
      db.select().from(schema.locations),
      db.select().from(schema.branchPrices),
      db.select().from(schema.customerPrices),
      db.select().from(schema.discountRequests),
      db.select().from(schema.systemUsers),
      db.select().from(schema.companySettings),
      db.select().from(schema.categories),
      db.select().from(schema.customerTypes),
      db.select().from(schema.locationConfigs)
    ]);

    lastSyncTime = new Date().toISOString();

    const products: Product[] = productsRows.map((r: any) => ({
      ...r,
      base_price: r.base_price ?? r.current_price ?? 0,
      current_price: r.current_price ?? 0,
      cost_price: r.cost_price ?? 0,
      min_selling_price: r.min_selling_price ?? 0,
      price_display_method: r.display_method || 'Standard',
      unit: r.unit || 'PCS',
      status: r.status || 'Active',
      stock_quantity: r.stock_quantity ?? 0,
      reorder_level: r.reorder_level ?? 0,
      main_material_spec: r.main_material_spec ?? undefined,
      glass_spec: r.glass_spec ?? undefined,
      hardware_specs: r.hardware_specs ?? undefined,
      custom_materials: r.custom_materials ?? undefined,
      quantity_breaks: r.quantity_breaks ?? undefined,
      price_breakdown: r.price_breakdown ?? undefined,
      branch_allocations: r.branch_allocations ?? undefined,
      tags: r.tags ?? undefined
    }));

    const branches: Branch[] = branchesRows.map((r: any) => ({
      ...r,
      code: r.branch_code,
      name: r.branch_name,
      region: r.location || '',
      is_main_branch: Boolean(r.is_head_office),
      default_margin_pct: r.default_margin_percent ?? 15,
      is_active: r.status === 'Active',
      settings: r.settings ?? undefined
    }));

    const customers: Customer[] = customersRows.map((r: any) => ({
      ...r,
      rating: r.rating ?? 5,
      total_orders: r.total_orders ?? 0,
      total_spent: r.total_spent ?? 0,
      credit_limit: r.credit_limit ?? 0,
      outstanding_balance: r.outstanding_balance ?? 0
    }));

    const quotations: Quotation[] = quotationsRows.map((r: any) => ({
      ...r,
      net_total: r.total_amount ?? 0,
      material_subtotal: r.subtotal ?? 0,
      transport_cost: r.transport_fee ?? 0,
      items: r.items ?? [],
      site_location_name: r.site_location?.location_name || '',
      site_address: r.site_location?.address || ''
    }));

    const priceHistory: PriceHistory[] = priceHistoryRows.map((r: any) => ({
      ...r,
      update_type: r.change_type || 'PRICE_CHANGE',
      changed_date: r.effective_date || r.created_at || ''
    }));

    const vehicles: Vehicle[] = vehiclesRows.map((r: any) => ({
      ...r,
      type: r.vehicle_type || r.type || 'Truck',
      capacity_kg: r.max_load_capacity || ((r.capacity_tons || 1) * 1000) || 1000,
      max_length_m: r.max_length_m || 4.5,
      base_charge: r.base_charge ?? r.base_rate ?? 2500,
      per_km_rate: r.per_km_rate ?? r.cost_per_km ?? 150,
      capacity_tons: r.capacity_tons ?? 1,
      cost_per_km: r.cost_per_km ?? 150,
      driver_allowance: r.driver_allowance ?? 1500,
      is_active: r.is_active !== false,
      max_load_capacity: r.max_load_capacity ?? 1000
    }));

    const transportRules: TransportRules = (transportRulesRows[0]?.rules_json as TransportRules) || {
      fuel_price_per_l: 350,
      driver_allowance: 3500,
      night_delivery_surcharge_pct: 15,
      remote_area_surcharge_pct: 20,
      min_distance_km: 10,
      base_fuel_rate: 350
    };

    const locations: SiteLocation[] = locationsRows.map((r: any) => ({
      ...r,
      distance_km: r.distance_from_colombo_km ?? 0,
      base_fee: r.base_fee ?? 2500,
      is_active: r.is_active !== false
    }));

    const branchPrices: BranchPriceOverride[] = branchPricesRows.map((r: any) => ({
      ...r,
      special_price: r.special_price ?? 0,
      margin_percent: r.margin_percent ?? 0
    }));

    const customerPrices: CustomerPriceOverride[] = customerPricesRows.map((r: any) => ({
      ...r,
      special_price: r.special_price ?? 0,
      discount_percent: r.discount_percent ?? 0
    }));

    const discountRequests: DiscountApprovalRequest[] = discountRequestsRows.map((r: any) => ({
      ...r,
      original_amount: r.original_amount ?? 0,
      requested_discount_percent: r.requested_discount_percent ?? 0,
      proposed_amount: r.proposed_amount ?? 0
    }));

    const systemUsers: SystemUser[] = systemUsersRows.map((r: any) => ({
      ...r,
      authAuditLogs: r.auth_audit_logs ?? [],
      mfaBackupCodes: r.mfa_backup_codes ?? []
    }));

    const companySettings: CompanySettings = (companySettingsRows[0] as any) || {
      company_name: 'Innovista Aluminium & Glass',
      currency: 'LKR'
    };

    const categories: CategoryConfig[] = categoriesRows.map((r: any) => ({
      ...r,
      is_active: r.is_active !== false
    }));

    const customerTypes: CustomerTypeConfig[] = customerTypesRows.map((r: any) => ({
      ...r,
      default_discount_percent: r.default_discount_percent ?? 0
    }));

    const locationConfigs: LocationConfig[] = locationConfigsRows.map((r: any) => ({
      ...r,
      transport_rate_multiplier: r.transport_rate_multiplier ?? 1.0
    }));

    return {
      products,
      branches,
      customers,
      quotations,
      priceHistory,
      vehicles,
      transportRules,
      locations,
      branchPrices,
      customerPrices,
      discountRequests,
      systemUsers,
      companySettings,
      categories,
      customerTypes,
      locationConfigs
    };
  } catch (err) {
    console.error('❌ Error reading from PostgreSQL database:', err);
    throw err;
  }
}

// Upsert helpers for real-time synchronization
export async function syncProductToPostgres(p: Product) {
  try {
    const rawP = p as any;
    const basePrice = Number(p.base_price ?? p.current_price ?? 0);
    await db.insert(schema.products)
      .values({
        id: p.id,
        product_code: p.product_code,
        product_name: p.product_name,
        category: p.category || '',
        sub_category: p.sub_category || '',
        brand: rawP.brand || p.supplier || '',
        current_price: Number(p.current_price ?? basePrice),
        base_price: basePrice,
        cost_price: Number(p.cost_price ?? Math.round(basePrice * 0.8)),
        min_selling_price: Number(p.min_selling_price ?? Math.round(basePrice * 0.9)),
        unit: p.unit || 'PCS',
        display_method: p.price_display_method || 'Standard',
        pricing_tier: rawP.pricing_tier || '',
        customer_type: rawP.customer_type || '',
        region_zone: rawP.region_zone || '',
        project_type: rawP.project_type || '',
        material_grade: rawP.material_grade || '',
        material_thickness: rawP.material_thickness || '',
        material_finish: rawP.material_finish || '',
        material_colour: rawP.material_colour || '',
        glass_type: rawP.glass_type || '',
        installation_option: rawP.installation_option || '',
        discount_method: rawP.discount_method || '',
        status: p.status || 'Active',
        stock_quantity: Number(rawP.stock_quantity ?? 0),
        reorder_level: Number(rawP.reorder_level ?? 0),
        image_url: p.image_url || '',
        notes: rawP.notes || p.description || '',
        main_material_spec: rawP.main_material_spec || null,
        glass_spec: rawP.glass_spec || null,
        hardware_specs: rawP.hardware_specs || null,
        custom_materials: rawP.custom_materials || null,
        quantity_breaks: p.quantity_breaks || null,
        price_breakdown: rawP.price_breakdown || null,
        branch_allocations: rawP.branch_allocations || null,
        tags: rawP.tags || null,
        created_at: rawP.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.products.id,
        set: {
          product_name: p.product_name,
          category: p.category || '',
          sub_category: p.sub_category || '',
          brand: rawP.brand || p.supplier || '',
          current_price: Number(p.current_price ?? basePrice),
          base_price: basePrice,
          cost_price: Number(p.cost_price ?? Math.round(basePrice * 0.8)),
          min_selling_price: Number(p.min_selling_price ?? Math.round(basePrice * 0.9)),
          unit: p.unit || 'PCS',
          display_method: p.price_display_method || 'Standard',
          status: p.status || 'Active',
          stock_quantity: Number(rawP.stock_quantity ?? 0),
          image_url: p.image_url || '',
          notes: rawP.notes || p.description || '',
          updated_at: new Date().toISOString()
        }
      });
  } catch (err) {
    console.error('Failed to sync product to PostgreSQL:', err);
  }
}

export async function deleteProductFromPostgres(id: string) {
  try {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  } catch (err) {
    console.error('Failed to delete product from PostgreSQL:', err);
  }
}

export async function syncQuotationToPostgres(q: Quotation) {
  try {
    const rawQ = q as any;
    await db.insert(schema.quotations)
      .values({
        id: q.id,
        quotation_number: q.quotation_number,
        customer_name: q.customer_name,
        customer_id: rawQ.customer_id || '',
        customer_phone: q.customer_phone || '',
        customer_email: q.customer_email || '',
        branch_id: q.branch_id || '',
        branch_name: q.branch_name || '',
        status: q.status || 'Draft',
        subtotal: Number(q.subtotal ?? q.material_subtotal ?? 0),
        transport_fee: Number(rawQ.transport_fee ?? q.transport_cost ?? 0),
        discount_amount: Number(q.discount_amount ?? 0),
        tax_amount: Number(q.tax_amount ?? 0),
        total_amount: Number(q.total_amount ?? q.net_total ?? 0),
        validity_date: rawQ.validity_date || q.valid_until || '',
        created_by: q.created_by || '',
        created_at: q.created_at || q.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: q.items || null,
        notes: q.notes || '',
        site_location: { address: q.site_address, location_name: q.site_location_name }
      })
      .onConflictDoUpdate({
        target: schema.quotations.id,
        set: {
          status: q.status || 'Draft',
          subtotal: Number(q.subtotal ?? q.material_subtotal ?? 0),
          transport_fee: Number(rawQ.transport_fee ?? q.transport_cost ?? 0),
          discount_amount: Number(q.discount_amount ?? 0),
          tax_amount: Number(q.tax_amount ?? 0),
          total_amount: Number(q.total_amount ?? q.net_total ?? 0),
          updated_at: new Date().toISOString(),
          items: q.items || null,
          notes: q.notes || ''
        }
      });
  } catch (err) {
    console.error('Failed to sync quotation to PostgreSQL:', err);
  }
}

export async function deleteQuotationFromPostgres(id: string) {
  try {
    await db.delete(schema.quotations).where(eq(schema.quotations.id, id));
  } catch (err) {
    console.error('Failed to delete quotation from PostgreSQL:', err);
  }
}

export async function syncCustomerToPostgres(c: Customer) {
  try {
    const rawC = c as any;
    await db.insert(schema.customers)
      .values({
        id: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        company: rawC.company || '',
        customer_type: c.customer_type || '',
        tier: rawC.tier || 'Standard',
        rating: Number(rawC.rating ?? 5),
        total_orders: Number(rawC.total_orders ?? 0),
        total_spent: Number(rawC.total_spent ?? 0),
        credit_limit: Number(rawC.credit_limit ?? 0),
        outstanding_balance: Number(rawC.outstanding_balance ?? 0),
        address: c.address || '',
        city: rawC.city || c.district_region || '',
        status: rawC.status || 'Active',
        created_at: c.created_at || new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.customers.id,
        set: {
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          company: rawC.company || '',
          customer_type: c.customer_type || '',
          tier: rawC.tier || 'Standard',
          rating: Number(rawC.rating ?? 5),
          total_orders: Number(rawC.total_orders ?? 0),
          total_spent: Number(rawC.total_spent ?? 0),
          credit_limit: Number(rawC.credit_limit ?? 0),
          outstanding_balance: Number(rawC.outstanding_balance ?? 0),
          address: c.address || '',
          city: rawC.city || c.district_region || '',
          status: rawC.status || 'Active'
        }
      });
  } catch (err) {
    console.error('Failed to sync customer to PostgreSQL:', err);
  }
}

export async function deleteCustomerFromPostgres(id: string) {
  try {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
  } catch (err) {
    console.error('Failed to delete customer from PostgreSQL:', err);
  }
}

export async function syncUserToPostgres(u: SystemUser) {
  try {
    const rawU = u as any;
    await db.insert(schema.systemUsers)
      .values({
        id: u.id,
        uid: rawU.uid || null,
        employee_id: u.employee_id || '',
        full_name: u.name || rawU.full_name || '',
        username: rawU.username || u.email,
        email: u.email,
        password: u.password || '',
        role: u.role,
        branch_id: u.branch_id || '',
        branch_name: u.branch_name || '',
        phone: u.phone || '',
        status: u.status || 'Active',
        critical_pin: u.critical_pin || null,
        mfa_enabled: Boolean(u.mfaEnabled ?? rawU.mfa_enabled),
        mfa_secret: u.mfaSecret ?? rawU.mfa_secret ?? null,
        mfa_backup_codes: u.mfaBackupCodes || null,
        permissions: rawU.permissions || null,
        auth_audit_logs: u.authAuditLogs || null,
        last_login: u.last_login || null,
        created_at: u.created_at || new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.systemUsers.id,
        set: {
          full_name: u.name || rawU.full_name || '',
          email: u.email,
          password: u.password || '',
          role: u.role,
          branch_id: u.branch_id || '',
          branch_name: u.branch_name || '',
          phone: u.phone || '',
          status: u.status || 'Active',
          critical_pin: u.critical_pin || null,
          mfa_enabled: Boolean(u.mfaEnabled ?? rawU.mfa_enabled),
          mfa_secret: u.mfaSecret ?? rawU.mfa_secret ?? null,
          mfa_backup_codes: u.mfaBackupCodes || null,
          permissions: rawU.permissions || null,
          auth_audit_logs: u.authAuditLogs || null,
          last_login: u.last_login || null
        }
      });
  } catch (err) {
    console.error('Failed to sync user to PostgreSQL:', err);
  }
}

export async function deleteUserFromPostgres(id: string) {
  try {
    await db.delete(schema.systemUsers).where(eq(schema.systemUsers.id, id));
  } catch (err) {
    console.error('Failed to delete user from PostgreSQL:', err);
  }
}

export async function syncPriceHistoryToPostgres(ph: PriceHistory) {
  try {
    const rawPh = ph as any;
    await db.insert(schema.priceHistory)
      .values({
        id: ph.id,
        product_id: ph.product_id || '',
        product_code: ph.product_code || '',
        product_name: ph.product_name || '',
        old_price: Number(ph.old_price ?? 0),
        new_price: Number(ph.new_price ?? 0),
        change_percent: Number(rawPh.change_percent ?? 0),
        change_type: rawPh.change_type || ph.update_type || '',
        effective_date: rawPh.effective_date || ph.changed_date || '',
        reason: ph.reason || '',
        changed_by: ph.changed_by || '',
        branch_id: rawPh.branch_id || ph.branch_affected || '',
        created_at: rawPh.created_at || new Date().toISOString()
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error('Failed to sync price history to PostgreSQL:', err);
  }
}

export async function syncBranchPriceToPostgres(bp: BranchPriceOverride) {
  try {
    const rawBp = bp as any;
    await db.insert(schema.branchPrices)
      .values({
        id: bp.id,
        product_id: bp.product_id,
        product_code: bp.product_code || '',
        branch_id: bp.branch_id,
        branch_code: bp.branch_code || '',
        special_price: Number(bp.special_price ?? 0),
        margin_percent: Number(rawBp.margin_percent ?? 0),
        effective_from: bp.effective_from || '',
        effective_to: bp.effective_to || '',
        status: bp.status || 'Active',
        created_at: rawBp.created_at || new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.branchPrices.id,
        set: {
          special_price: Number(bp.special_price ?? 0),
          margin_percent: Number(rawBp.margin_percent ?? 0),
          effective_from: bp.effective_from || '',
          effective_to: bp.effective_to || '',
          status: bp.status || 'Active'
        }
      });
  } catch (err) {
    console.error('Failed to sync branch price to PostgreSQL:', err);
  }
}

export async function deleteBranchPriceFromPostgres(id: string) {
  try {
    await db.delete(schema.branchPrices).where(eq(schema.branchPrices.id, id));
  } catch (err) {
    console.error('Failed to delete branch price from PostgreSQL:', err);
  }
}

export async function syncCustomerPriceToPostgres(cp: CustomerPriceOverride) {
  try {
    const rawCp = cp as any;
    await db.insert(schema.customerPrices)
      .values({
        id: cp.id,
        customer_name: cp.customer_name,
        customer_id: rawCp.customer_id || '',
        product_id: cp.product_id,
        product_code: cp.product_code || '',
        special_price: Number(cp.special_price ?? 0),
        discount_percent: Number(cp.discount_pct ?? rawCp.discount_percent ?? 0),
        effective_from: cp.effective_from || '',
        effective_to: cp.effective_to || '',
        created_at: rawCp.created_at || new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.customerPrices.id,
        set: {
          special_price: Number(cp.special_price ?? 0),
          discount_percent: Number(cp.discount_pct ?? rawCp.discount_percent ?? 0),
          effective_from: cp.effective_from || '',
          effective_to: cp.effective_to || ''
        }
      });
  } catch (err) {
    console.error('Failed to sync customer price to PostgreSQL:', err);
  }
}

export async function deleteCustomerPriceFromPostgres(id: string) {
  try {
    await db.delete(schema.customerPrices).where(eq(schema.customerPrices.id, id));
  } catch (err) {
    console.error('Failed to delete customer price from PostgreSQL:', err);
  }
}

export async function syncDiscountRequestToPostgres(dr: DiscountApprovalRequest) {
  try {
    const rawDr = dr as any;
    await db.insert(schema.discountRequests)
      .values({
        id: dr.id,
        quotation_id: dr.quotation_id || '',
        quotation_number: dr.quotation_number || '',
        requested_by: dr.requested_by || '',
        customer_name: dr.customer_name || '',
        original_amount: Number(dr.original_amount ?? 0),
        requested_discount_percent: Number(dr.requested_discount_pct ?? rawDr.requested_discount_percent ?? 0),
        proposed_amount: Number(rawDr.proposed_amount ?? dr.discounted_amount ?? 0),
        reason: dr.reason || '',
        status: dr.status || 'Pending',
        approved_by: rawDr.approved_by || dr.reviewed_by || '',
        approved_at: rawDr.approved_at || dr.review_date || '',
        created_at: dr.created_at || new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.discountRequests.id,
        set: {
          status: dr.status,
          approved_by: rawDr.approved_by || dr.reviewed_by || '',
          approved_at: rawDr.approved_at || dr.review_date || ''
        }
      });
  } catch (err) {
    console.error('Failed to sync discount request to PostgreSQL:', err);
  }
}

export async function syncCompanySettingsToPostgres(cs: CompanySettings) {
  try {
    const rawCs = cs as any;
    await db.insert(schema.companySettings)
      .values({
        id: 'default-company-settings',
        company_name: cs.company_name,
        tag_line: cs.tagline || rawCs.tag_line || '',
        address: cs.address || '',
        city: rawCs.city || '',
        phone: cs.phone || '',
        email: cs.email || '',
        website: cs.website || '',
        tax_no: cs.tax_vat_id || rawCs.tax_no || '',
        logo_url: cs.logo_url || '',
        currency: rawCs.currency || 'LKR',
        quotation_terms: cs.invoice_footer_terms || rawCs.quotation_terms || '',
        email_settings: rawCs.email_settings || null,
        updated_at: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.companySettings.id,
        set: {
          company_name: cs.company_name,
          tag_line: cs.tagline || rawCs.tag_line || '',
          address: cs.address || '',
          city: rawCs.city || '',
          phone: cs.phone || '',
          email: cs.email || '',
          website: cs.website || '',
          tax_no: cs.tax_vat_id || rawCs.tax_no || '',
          logo_url: cs.logo_url || '',
          currency: rawCs.currency || 'LKR',
          quotation_terms: cs.invoice_footer_terms || rawCs.quotation_terms || '',
          email_settings: rawCs.email_settings || null,
          updated_at: new Date().toISOString()
        }
      });
  } catch (err) {
    console.error('Failed to sync company settings to PostgreSQL:', err);
  }
}

export async function syncTransportRulesToPostgres(tr: TransportRules) {
  try {
    const rawTr = tr as any;
    await db.insert(schema.transportRules)
      .values({
        id: 'default-transport-rules',
        base_transport_fee: Number(rawTr.base_transport_fee ?? rawTr.base_fuel_rate ?? 2500),
        per_km_rate: Number(rawTr.per_km_rate ?? 160),
        free_delivery_threshold: Number(rawTr.free_delivery_threshold ?? 200000),
        heavy_vehicle_surcharge: Number(rawTr.heavy_vehicle_surcharge ?? 5000),
        rules_json: tr,
        updated_at: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.transportRules.id,
        set: {
          base_transport_fee: Number(rawTr.base_transport_fee ?? rawTr.base_fuel_rate ?? 2500),
          per_km_rate: Number(rawTr.per_km_rate ?? 160),
          free_delivery_threshold: Number(rawTr.free_delivery_threshold ?? 200000),
          heavy_vehicle_surcharge: Number(rawTr.heavy_vehicle_surcharge ?? 5000),
          rules_json: tr,
          updated_at: new Date().toISOString()
        }
      });
  } catch (err) {
    console.error('Failed to sync transport rules to PostgreSQL:', err);
  }
}

export async function getPostgresDiagnostics(): Promise<PostgresDiagnostics> {
  const tableCounts: Record<string, number> = {};
  let totalRecords = 0;

  try {
    const counts = await Promise.all([
      db.select().from(schema.products).then(r => r.length),
      db.select().from(schema.branches).then(r => r.length),
      db.select().from(schema.customers).then(r => r.length),
      db.select().from(schema.quotations).then(r => r.length),
      db.select().from(schema.priceHistory).then(r => r.length),
      db.select().from(schema.systemUsers).then(r => r.length),
      db.select().from(schema.vehicles).then(r => r.length),
      db.select().from(schema.locations).then(r => r.length),
      db.select().from(schema.branchPrices).then(r => r.length),
      db.select().from(schema.customerPrices).then(r => r.length),
      db.select().from(schema.discountRequests).then(r => r.length),
      db.select().from(schema.categories).then(r => r.length),
      db.select().from(schema.customerTypes).then(r => r.length),
      db.select().from(schema.locationConfigs).then(r => r.length)
    ]);

    tableCounts.products = counts[0];
    tableCounts.branches = counts[1];
    tableCounts.customers = counts[2];
    tableCounts.quotations = counts[3];
    tableCounts.price_history = counts[4];
    tableCounts.system_users = counts[5];
    tableCounts.vehicles = counts[6];
    tableCounts.locations = counts[7];
    tableCounts.branch_prices = counts[8];
    tableCounts.customer_prices = counts[9];
    tableCounts.discount_requests = counts[10];
    tableCounts.categories = counts[11];
    tableCounts.customer_types = counts[12];
    tableCounts.location_configs = counts[13];

    totalRecords = counts.reduce((acc, c) => acc + c, 0);

    const host = process.env.AWS_EC2_POSTGRES_HOST || process.env.AWS_RDS_POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'AWS EC2 Instance Host / IP';
    const database = process.env.AWS_EC2_POSTGRES_DATABASE || process.env.AWS_RDS_POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'innovista_aws_db';
    const user = process.env.AWS_EC2_POSTGRES_USER || process.env.AWS_RDS_POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';

    return {
      provider: 'AWS EC2 PostgreSQL',
      engine: 'AWS EC2 Linux Instance (Self-Hosted PostgreSQL via Drizzle ORM on Amazon EC2)',
      status: 'STABLE_POSTGRES',
      isConnected: true,
      database,
      host,
      user,
      tableCounts,
      totalRecords,
      lastSyncTime,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000)
    };
  } catch (err: any) {
    const host = process.env.AWS_EC2_POSTGRES_HOST || process.env.AWS_RDS_POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'AWS EC2 Instance Host / IP';
    const database = process.env.AWS_EC2_POSTGRES_DATABASE || process.env.AWS_RDS_POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'innovista_aws_db';
    const user = process.env.AWS_EC2_POSTGRES_USER || process.env.AWS_RDS_POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';

    return {
      provider: 'AWS EC2 PostgreSQL',
      engine: 'AWS EC2 Linux Instance (PostgreSQL on Amazon EC2)',
      status: 'DEGRADED',
      isConnected: false,
      database,
      host,
      user,
      tableCounts: {},
      totalRecords: 0,
      lastSyncTime,
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000)
    };
  }
}
