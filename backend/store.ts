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
import { 
  Product, 
  PriceHistory, 
  Branch, 
  Vehicle, 
  TransportRules, 
  SiteLocation, 
  Quotation, 
  BranchPriceOverride, 
  CustomerPriceOverride, 
  DiscountApprovalRequest, 
  PricePriorityResolution, 
  Customer, 
  CompanySettings, 
  SystemUser, 
  CategoryConfig, 
  LocationConfig, 
  CustomerTypeConfig 
} from '../shared/types';
import { 
  loadAllFromPostgres, 
  syncProductToPostgres, 
  syncQuotationToPostgres, 
  syncCustomerToPostgres, 
  syncUserToPostgres, 
  syncPriceHistoryToPostgres, 
  syncBranchPriceToPostgres, 
  syncCustomerPriceToPostgres, 
  syncDiscountRequestToPostgres, 
  syncCompanySettingsToPostgres, 
  syncTransportRulesToPostgres 
} from './postgresDb';

export interface DatabaseStore {
  products: Product[];
  priceHistory: PriceHistory[];
  branches: Branch[];
  vehicles: Vehicle[];
  transportRules: TransportRules;
  locations: SiteLocation[];
  quotations: Quotation[];
  branchPrices: BranchPriceOverride[];
  customerPrices: CustomerPriceOverride[];
  discountRequests: DiscountApprovalRequest[];
  customers: Customer[];
  companySettings: CompanySettings;
  systemUsers: SystemUser[];
  categories: CategoryConfig[];
  customerTypes: CustomerTypeConfig[];
  locationConfigs: LocationConfig[];
}

export const store: DatabaseStore = {
  products: [...INITIAL_PRODUCTS],
  priceHistory: [...INITIAL_PRICE_HISTORY],
  branches: [...INITIAL_BRANCHES],
  vehicles: [...INITIAL_VEHICLES],
  transportRules: { ...INITIAL_TRANSPORT_RULES },
  locations: [...INITIAL_LOCATIONS],
  quotations: [...INITIAL_QUOTATIONS],
  branchPrices: [...INITIAL_BRANCH_PRICES],
  customerPrices: [...INITIAL_CUSTOMER_PRICES],
  discountRequests: [...INITIAL_DISCOUNT_REQUESTS],
  customers: [...INITIAL_CUSTOMERS],
  companySettings: { ...INITIAL_COMPANY_SETTINGS },
  systemUsers: [...INITIAL_USERS],
  categories: [...INITIAL_CATEGORIES],
  customerTypes: [...INITIAL_CUSTOMER_TYPES],
  locationConfigs: [...INITIAL_LOCATION_CONFIGS]
};

let isLoadingPostgres = false;
let isLoadedFromPostgres = false;

export async function loadDatabase(): Promise<void> {
  if (isLoadingPostgres) return;
  isLoadingPostgres = true;

  try {
    console.log('🔄 Connecting to AWS EC2 PostgreSQL database...');
    const pgData = await loadAllFromPostgres();
    if (pgData && pgData.products && pgData.products.length > 0) {
      store.products = pgData.products;
      store.branches = pgData.branches.length > 0 ? pgData.branches : [...INITIAL_BRANCHES];
      store.customers = pgData.customers.length > 0 ? pgData.customers : [...INITIAL_CUSTOMERS];
      store.quotations = pgData.quotations;
      store.priceHistory = pgData.priceHistory;
      store.vehicles = pgData.vehicles.length > 0 ? pgData.vehicles : [...INITIAL_VEHICLES];
      store.transportRules = pgData.transportRules || { ...INITIAL_TRANSPORT_RULES };
      store.locations = pgData.locations.length > 0 ? pgData.locations : [...INITIAL_LOCATIONS];
      store.branchPrices = pgData.branchPrices;
      store.customerPrices = pgData.customerPrices;
      store.discountRequests = pgData.discountRequests;
      store.systemUsers = pgData.systemUsers.length > 0 ? pgData.systemUsers : [...INITIAL_USERS];
      store.companySettings = pgData.companySettings || { ...INITIAL_COMPANY_SETTINGS };
      store.categories = pgData.categories.length > 0 ? pgData.categories : [...INITIAL_CATEGORIES];
      store.customerTypes = pgData.customerTypes.length > 0 ? pgData.customerTypes : [...INITIAL_CUSTOMER_TYPES];
      store.locationConfigs = pgData.locationConfigs.length > 0 ? pgData.locationConfigs : [...INITIAL_LOCATION_CONFIGS];

      isLoadedFromPostgres = true;
      console.log(`✅ Successfully loaded entire enterprise database from AWS EC2 PostgreSQL (${store.products.length} products, ${store.branches.length} branches, ${store.quotations.length} quotations, ${store.customers.length} customers, ${store.systemUsers.length} users).`);
    } else {
      console.log('⚠️ PostgreSQL tables were empty, retaining memory state and syncing initial seed.');
    }
  } catch (err: any) {
    console.error('❌ Failed to load from PostgreSQL:', err.message);
  } finally {
    isLoadingPostgres = false;
  }
}

// Background asynchronous synchronization to PostgreSQL
let saveTimeout: any = null;

export function saveDatabase(): void {
  // Sync modified items in background to AWS EC2 PostgreSQL
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      if (store.companySettings) {
        await syncCompanySettingsToPostgres(store.companySettings);
      }
      if (store.transportRules) {
        await syncTransportRulesToPostgres(store.transportRules);
      }
    } catch (err) {
      console.error('PostgreSQL background sync error:', err);
    }
  }, 100);
}

export function resetDatabaseToDefaults(): void {
  store.products = [...INITIAL_PRODUCTS];
  store.priceHistory = [...INITIAL_PRICE_HISTORY];
  store.branches = [...INITIAL_BRANCHES];
  store.vehicles = [...INITIAL_VEHICLES];
  store.transportRules = { ...INITIAL_TRANSPORT_RULES };
  store.locations = [...INITIAL_LOCATIONS];
  store.quotations = [...INITIAL_QUOTATIONS];
  store.branchPrices = [...INITIAL_BRANCH_PRICES];
  store.customerPrices = [...INITIAL_CUSTOMER_PRICES];
  store.discountRequests = [...INITIAL_DISCOUNT_REQUESTS];
  store.customers = [...INITIAL_CUSTOMERS];
  store.companySettings = { ...INITIAL_COMPANY_SETTINGS };
  store.systemUsers = [...INITIAL_USERS];
  store.categories = [...INITIAL_CATEGORIES];
  store.customerTypes = [...INITIAL_CUSTOMER_TYPES];
  store.locationConfigs = [...INITIAL_LOCATION_CONFIGS];

  saveDatabase();
}

// 4-Tier Price Priority Logic Resolution Engine
export function resolvePricePriority(productId: string, branchId?: string, customerName?: string): PricePriorityResolution {
  const prod = store.products.find(p => p.id === productId || p.product_code === productId);
  if (!prod) {
    return {
      final_price: 0,
      tier: 'COMPANY_BASE',
      tier_label: 'Product Not Found',
      badge_color: 'bg-slate-700 text-slate-300 border-slate-600',
      product_code: productId,
      product_name: 'Unknown Product',
      base_price: 0,
      cost_price: 0,
      min_selling_price: 0
    };
  }

  const basePrice = prod.base_price || prod.current_price;
  const costPrice = prod.cost_price || Math.round(basePrice * 0.8);
  const minSellingPrice = prod.min_selling_price || Math.round(basePrice * 0.9);

  const todayStr = new Date().toISOString().split('T')[0];

  // Priority 1: Customer Price Override (highest priority)
  if (customerName) {
    const custMatch = store.customerPrices.find(cp => 
      (cp.product_id === prod.id || cp.product_code === prod.product_code) &&
      cp.customer_name.toLowerCase().trim() === customerName.toLowerCase().trim() &&
      (!cp.effective_from || cp.effective_from <= todayStr) &&
      (!cp.effective_to || cp.effective_to >= todayStr)
    );
    if (custMatch) {
      return {
        final_price: custMatch.special_price,
        tier: 'CUSTOMER_SPECIAL',
        tier_label: `🎯 Customer Contract Rate (${customerName})`,
        badge_color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        product_code: prod.product_code,
        product_name: prod.product_name,
        base_price: basePrice,
        cost_price: costPrice,
        min_selling_price: minSellingPrice,
        customer_special_price: custMatch.special_price
      };
    }
  }

  // Priority 2: Branch Special Price Override
  if (branchId) {
    const branchMatch = store.branchPrices.find(bp => 
      (bp.product_id === prod.id || bp.product_code === prod.product_code) &&
      (bp.branch_id === branchId || bp.branch_code === branchId) &&
      bp.status !== 'Expired' &&
      (!bp.effective_from || bp.effective_from <= todayStr) &&
      (!bp.effective_to || bp.effective_to >= todayStr)
    );
    if (branchMatch) {
      const branchObj = store.branches.find(b => b.id === branchId || b.code === branchId);
      const bName = branchObj ? branchObj.name : 'Branch';
      return {
        final_price: branchMatch.special_price,
        tier: 'BRANCH_OVERRIDE',
        tier_label: `📍 ${bName} Override Rate`,
        badge_color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        product_code: prod.product_code,
        product_name: prod.product_name,
        base_price: basePrice,
        cost_price: costPrice,
        min_selling_price: minSellingPrice,
        branch_override_price: branchMatch.special_price
      };
    }
  }

  // Priority 3: Regional / Branch Margin Control Price
  if (branchId) {
    const branchObj = store.branches.find(b => b.id === branchId || b.code === branchId);
    if (branchObj && branchObj.margin_pct && branchObj.margin_pct > 0 && branchObj.code !== 'HO') {
      const marginPrice = Math.round(costPrice * (1 + branchObj.margin_pct / 100));
      return {
        final_price: marginPrice,
        tier: 'BRANCH_MARGIN',
        tier_label: `📈 Regional Margin Rule (${branchObj.margin_pct}% on Cost)`,
        badge_color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        product_code: prod.product_code,
        product_name: prod.product_name,
        base_price: basePrice,
        cost_price: costPrice,
        min_selling_price: minSellingPrice,
        branch_margin_price: marginPrice,
        branch_margin_pct: branchObj.margin_pct
      };
    }
  }

  // Priority 4: Company Base Price
  return {
    final_price: basePrice,
    tier: 'COMPANY_BASE',
    tier_label: '🏢 Company Base Rate',
    badge_color: 'bg-slate-700/80 text-slate-300 border-slate-600',
    product_code: prod.product_code,
    product_name: prod.product_name,
    base_price: basePrice,
    cost_price: costPrice,
    min_selling_price: minSellingPrice
  };
}
