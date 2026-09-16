import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Authentication Users table (AWS EC2 PostgreSQL schema)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products Master Table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  product_code: text('product_code').notNull().unique(),
  product_name: text('product_name').notNull(),
  category: text('category'),
  sub_category: text('sub_category'),
  brand: text('brand'),
  current_price: doublePrecision('current_price').default(0),
  base_price: doublePrecision('base_price').default(0),
  cost_price: doublePrecision('cost_price').default(0),
  min_selling_price: doublePrecision('min_selling_price').default(0),
  unit: text('unit').default('PCS'),
  display_method: text('display_method'),
  pricing_tier: text('pricing_tier'),
  customer_type: text('customer_type'),
  region_zone: text('region_zone'),
  project_type: text('project_type'),
  material_grade: text('material_grade'),
  material_thickness: text('material_thickness'),
  material_finish: text('material_finish'),
  material_colour: text('material_colour'),
  glass_type: text('glass_type'),
  installation_option: text('installation_option'),
  discount_method: text('discount_method'),
  status: text('status').default('Active'),
  stock_quantity: integer('stock_quantity').default(0),
  reorder_level: integer('reorder_level').default(0),
  image_url: text('image_url'),
  notes: text('notes'),
  main_material_spec: jsonb('main_material_spec'),
  glass_spec: jsonb('glass_spec'),
  hardware_specs: jsonb('hardware_specs'),
  custom_materials: jsonb('custom_materials'),
  quantity_breaks: jsonb('quantity_breaks'),
  price_breakdown: jsonb('price_breakdown'),
  branch_allocations: jsonb('branch_allocations'),
  tags: jsonb('tags'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
});

// Branches Table
export const branches = pgTable('branches', {
  id: text('id').primaryKey(),
  branch_code: text('branch_code').notNull().unique(),
  branch_name: text('branch_name').notNull(),
  location: text('location'),
  city: text('city'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  is_head_office: boolean('is_head_office').default(false),
  default_margin_percent: doublePrecision('default_margin_percent').default(15),
  manager_name: text('manager_name'),
  status: text('status').default('Active'),
  settings: jsonb('settings'),
  created_at: text('created_at'),
});

// System Users Table (Local ERP & Cloud Accounts)
export const systemUsers = pgTable('system_users', {
  id: text('id').primaryKey(),
  uid: text('uid'),
  employee_id: text('employee_id'),
  full_name: text('full_name').notNull(),
  username: text('username'),
  email: text('email').notNull(),
  password: text('password'),
  role: text('role').notNull(),
  branch_id: text('branch_id'),
  branch_name: text('branch_name'),
  phone: text('phone'),
  status: text('status').default('Active'),
  critical_pin: text('critical_pin'),
  mfa_enabled: boolean('mfa_enabled').default(false),
  mfa_secret: text('mfa_secret'),
  mfa_backup_codes: jsonb('mfa_backup_codes'),
  permissions: jsonb('permissions'),
  auth_audit_logs: jsonb('auth_audit_logs'),
  last_login: text('last_login'),
  created_at: text('created_at'),
});

// Customers Table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  customer_type: text('customer_type'),
  tier: text('tier'),
  rating: doublePrecision('rating').default(5),
  total_orders: integer('total_orders').default(0),
  total_spent: doublePrecision('total_spent').default(0),
  credit_limit: doublePrecision('credit_limit').default(0),
  outstanding_balance: doublePrecision('outstanding_balance').default(0),
  address: text('address'),
  city: text('city'),
  status: text('status').default('Active'),
  created_at: text('created_at'),
});

// Quotations Table
export const quotations = pgTable('quotations', {
  id: text('id').primaryKey(),
  quotation_number: text('quotation_number').notNull().unique(),
  customer_name: text('customer_name').notNull(),
  customer_id: text('customer_id'),
  customer_phone: text('customer_phone'),
  customer_email: text('customer_email'),
  branch_id: text('branch_id'),
  branch_name: text('branch_name'),
  status: text('status').default('Draft'),
  subtotal: doublePrecision('subtotal').default(0),
  transport_fee: doublePrecision('transport_fee').default(0),
  discount_amount: doublePrecision('discount_amount').default(0),
  tax_amount: doublePrecision('tax_amount').default(0),
  total_amount: doublePrecision('total_amount').default(0),
  validity_date: text('validity_date'),
  created_by: text('created_by'),
  created_at: text('created_at'),
  updated_at: text('updated_at'),
  items: jsonb('items'),
  notes: text('notes'),
  site_location: jsonb('site_location'),
});

// Price History Audit Table
export const priceHistory = pgTable('price_history', {
  id: text('id').primaryKey(),
  product_id: text('product_id'),
  product_code: text('product_code'),
  product_name: text('product_name'),
  old_price: doublePrecision('old_price'),
  new_price: doublePrecision('new_price'),
  change_percent: doublePrecision('change_percent'),
  change_type: text('change_type'),
  effective_date: text('effective_date'),
  reason: text('reason'),
  changed_by: text('changed_by'),
  branch_id: text('branch_id'),
  created_at: text('created_at'),
});

// Vehicles Table
export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  registration_no: text('registration_no'),
  vehicle_type: text('vehicle_type').notNull(),
  fuel_type: text('fuel_type'),
  capacity_tons: doublePrecision('capacity_tons').default(1),
  cost_per_km: doublePrecision('cost_per_km').default(150),
  driver_allowance: doublePrecision('driver_allowance').default(1500),
  is_active: boolean('is_active').default(true),
  max_load_capacity: doublePrecision('max_load_capacity').default(1000),
});

// Transport Rules Table
export const transportRules = pgTable('transport_rules', {
  id: text('id').primaryKey(),
  base_transport_fee: doublePrecision('base_transport_fee').default(2500),
  per_km_rate: doublePrecision('per_km_rate').default(160),
  free_delivery_threshold: doublePrecision('free_delivery_threshold').default(200000),
  heavy_vehicle_surcharge: doublePrecision('heavy_vehicle_surcharge').default(5000),
  rules_json: jsonb('rules_json'),
  updated_at: text('updated_at'),
});

// Site Locations Table
export const locations = pgTable('locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  province: text('province'),
  district: text('district'),
  distance_from_colombo_km: doublePrecision('distance_from_colombo_km').default(0),
  base_fee: doublePrecision('base_fee').default(2500),
  is_active: boolean('is_active').default(true),
});

// Branch Price Overrides Table
export const branchPrices = pgTable('branch_prices', {
  id: text('id').primaryKey(),
  product_id: text('product_id').notNull(),
  product_code: text('product_code'),
  branch_id: text('branch_id').notNull(),
  branch_code: text('branch_code'),
  special_price: doublePrecision('special_price').notNull(),
  margin_percent: doublePrecision('margin_percent'),
  effective_from: text('effective_from'),
  effective_to: text('effective_to'),
  status: text('status').default('Active'),
  created_at: text('created_at'),
});

// Customer Price Overrides Table
export const customerPrices = pgTable('customer_prices', {
  id: text('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_id: text('customer_id'),
  product_id: text('product_id').notNull(),
  product_code: text('product_code'),
  special_price: doublePrecision('special_price').notNull(),
  discount_percent: doublePrecision('discount_percent'),
  effective_from: text('effective_from'),
  effective_to: text('effective_to'),
  created_at: text('created_at'),
});

// Discount Requests Table
export const discountRequests = pgTable('discount_requests', {
  id: text('id').primaryKey(),
  quotation_id: text('quotation_id'),
  quotation_number: text('quotation_number'),
  requested_by: text('requested_by'),
  customer_name: text('customer_name'),
  original_amount: doublePrecision('original_amount'),
  requested_discount_percent: doublePrecision('requested_discount_percent'),
  proposed_amount: doublePrecision('proposed_amount'),
  reason: text('reason'),
  status: text('status').default('Pending'),
  approved_by: text('approved_by'),
  approved_at: text('approved_at'),
  created_at: text('created_at'),
});

// Company Settings Table
export const companySettings = pgTable('company_settings', {
  id: text('id').primaryKey(),
  company_name: text('company_name'),
  tag_line: text('tag_line'),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  tax_no: text('tax_no'),
  logo_url: text('logo_url'),
  currency: text('currency').default('LKR'),
  quotation_terms: text('quotation_terms'),
  email_settings: jsonb('email_settings'),
  updated_at: text('updated_at'),
});

// Categories Table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  icon: text('icon'),
  is_active: boolean('is_active').default(true),
});

// Customer Types Table
export const customerTypes = pgTable('customer_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  default_discount_percent: doublePrecision('default_discount_percent').default(0),
  description: text('description'),
});

// Location Configs Table
export const locationConfigs = pgTable('location_configs', {
  id: text('id').primaryKey(),
  province: text('province'),
  district: text('district'),
  zone: text('zone'),
  transport_rate_multiplier: doublePrecision('transport_rate_multiplier').default(1.0),
});
