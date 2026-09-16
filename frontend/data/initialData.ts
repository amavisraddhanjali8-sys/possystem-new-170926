import { 
  Product, 
  PriceHistory, 
  Branch, 
  Vehicle, 
  TransportRules, 
  SiteLocation, 
  MaterialSupplier, 
  Quotation, 
  BranchPriceOverride, 
  CustomerPriceOverride, 
  DiscountApprovalRequest, 
  Customer, 
  CompanySettings, 
  SystemUser, 
  CategoryConfig, 
  LocationConfig, 
  CustomerTypeConfig 
} from '../../shared/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1788770949553',
    product_code: 'AL8972',
    product_name: 'Architectural Glazing Section AL8972',
    category: 'Aluminium Profiles',
    sub_category: 'Sliding Door Profiles',
    status: 'Active',
    unit: 'bar',
    price_display_method: 'Standard',
    unit_weight_kg: 4.5,
    base_price: 12500,
    current_price: 12500,
    cost_price: 10000,
    min_selling_price: 11250,
    description: 'Heavy duty architectural extruded aluminium sliding sash section.',
    effective_date: '2026-09-07',
    last_updated: '9/7/2026, 8:49:11 AM',
    updated_by: 'System Admin (Master)'
  },
  {
    id: 'prod-alu-slw-100',
    product_code: 'ALU-SLW-100',
    product_name: '100 Series Heavy Duty 2-Track Sliding Profile',
    category: 'Aluminium Profiles',
    sub_category: 'Sliding Window Profiles',
    status: 'Active',
    unit: 'bar',
    price_display_method: 'Standard',
    unit_weight_kg: 5.8,
    base_price: 18500,
    current_price: 18500,
    cost_price: 14800,
    min_selling_price: 16500,
    description: 'Commercial 100mm perimeter sliding frame with dual EPDM weatherstrip tracks.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-alu-csm-45',
    product_code: 'ALU-CSM-45',
    product_name: '45mm Euro Casement Door Frame Profile',
    category: 'Aluminium Profiles',
    sub_category: 'Casement Systems',
    status: 'Active',
    unit: 'bar',
    price_display_method: 'Standard',
    unit_weight_kg: 4.2,
    base_price: 14200,
    current_price: 14200,
    cost_price: 11500,
    min_selling_price: 12800,
    description: '45mm European standard architectural casement frame profile.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-gls-clr-06t',
    product_code: 'GLS-CLR-06T',
    product_name: '6mm Clear Tempered Architectural Safety Glass',
    category: 'Glass',
    sub_category: 'Toughened Safety Glass',
    status: 'Active',
    unit: 'sq.ft',
    price_display_method: 'Standard',
    unit_weight_kg: 15.0,
    base_price: 1250,
    current_price: 1250,
    cost_price: 950,
    min_selling_price: 1100,
    description: 'Grade-A toughened glass with polished ground edges for window units.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-gls-clr-10t',
    product_code: 'GLS-CLR-10T',
    product_name: '10mm Clear Toughened Frameless Glass Panel',
    category: 'Glass',
    sub_category: 'Commercial Glazing',
    status: 'Active',
    unit: 'sq.ft',
    price_display_method: 'Standard',
    unit_weight_kg: 25.0,
    base_price: 2450,
    current_price: 2450,
    cost_price: 1850,
    min_selling_price: 2200,
    description: '10mm high-impact tempered glass for structural balustrades and shopfronts.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-acp-met-04',
    product_code: 'ACP-MET-04',
    product_name: '4mm PVDF Metallic Silver ACP Cladding Sheet',
    category: 'ACP Sheets',
    sub_category: 'Exterior Cladding',
    status: 'Active',
    unit: 'sheet',
    price_display_method: 'Standard',
    unit_weight_kg: 18.5,
    base_price: 8800,
    current_price: 8800,
    cost_price: 7000,
    min_selling_price: 7900,
    description: '4mm architectural exterior cladding composite board with 15-year PVDF coat.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-hdw-mor-lck',
    product_code: 'HDW-MOR-LCK',
    product_name: 'Multi-Point German Mortise Security Door Lock',
    category: 'Hardware & Accessories',
    sub_category: 'Lock Systems',
    status: 'Active',
    unit: 'Unit',
    price_display_method: 'Standard',
    unit_weight_kg: 1.2,
    base_price: 4500,
    current_price: 4500,
    cost_price: 3200,
    min_selling_price: 3900,
    description: 'Heavy duty multi-point mortise lock body with euro profile brass cylinder.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  },
  {
    id: 'prod-hdw-rolr-hvy',
    product_code: 'HDW-ROLR-HVY',
    product_name: 'Heavy Duty Stainless Steel Tandem Sliding Roller Set',
    category: 'Hardware & Accessories',
    sub_category: 'Roller Systems',
    status: 'Active',
    unit: 'Unit',
    price_display_method: 'Standard',
    unit_weight_kg: 0.8,
    base_price: 2800,
    current_price: 2800,
    cost_price: 1900,
    min_selling_price: 2400,
    description: 'Precision ball-bearing tandem stainless steel rollers rated up to 150kg/panel.',
    effective_date: '2026-09-01',
    last_updated: '9/1/2026, 9:00:00 AM',
    updated_by: 'Nishantha Perera'
  }
];

export const INITIAL_PRICE_HISTORY: PriceHistory[] = [
  {
    id: 'ph-001',
    entity_type: 'PRICE',
    update_type: 'PRICE_CHANGE',
    product_id: 'p-001',
    product_code: 'ALU-SD-20',
    product_name: 'Aluminium Sliding Door Frame (Heavy Duty 2.0mm)',
    old_price: 24500,
    new_price: 26800,
    changed_by: 'Eng. Nishantha Perera (EMP-1001)',
    changed_by_role: 'Super Admin',
    changed_date: '2026-09-08 14:35:10',
    reason: 'Raw aluminium ingot import tariff adjustment and revised extrusion cost index',
    branch_affected: 'All Branches',
    region_affected: 'Island-wide',
    change_summary: 'Master Base Price adjusted from Rs. 24,500 to Rs. 26,800 (+Rs. 2,300, +9.4%)'
  },
  {
    id: 'ph-002',
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_STATUS_CHANGE',
    quotation_id: 'qt-1001',
    quotation_number: 'INV-QT-2026-8941',
    customer_name: 'Maga Engineering (Pvt) Ltd',
    product_code: 'INV-QT-2026-8941',
    product_name: 'Commercial Facade Package - Tower 2',
    old_price: 485000,
    new_price: 485000,
    changed_by: 'Eng. Nishantha Perera (EMP-1001)',
    changed_by_role: 'Super Admin',
    changed_date: '2026-09-08 16:20:45',
    reason: 'Head Office technical audit verified structural drawings and issued official barcode BC-HO-2026-8941',
    branch_affected: 'Head Office Admin Center',
    region_affected: 'Western Province',
    change_summary: 'Validated official quotation. Official Barcode: BC-HO-2026-8941, External Ref: EXT-ERP-94821, Status: Validated Official',
    old_status: 'Temporary Branch Draft',
    new_status: 'Validated Official'
  },
  {
    id: 'ph-003',
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_DISCOUNT',
    quotation_id: 'qt-1002',
    quotation_number: 'INV-QT-2026-9023',
    customer_name: 'Access Residencies',
    product_code: 'INV-QT-2026-9023',
    product_name: 'Balcony Glass Balustrade Fitting (60m)',
    old_price: 360000,
    new_price: 331200,
    changed_by: 'Kavinda Jayawardena (EMP-1002)',
    changed_by_role: 'HO Admin',
    changed_date: '2026-09-07 11:15:22',
    reason: 'Approved Corporate volume discount: 8% negotiated rate for multi-unit apartment complex',
    branch_affected: 'Colombo Port & City Sales',
    region_affected: 'Western Province',
    change_summary: 'Discount revised: 0% → 8% | Net Total adjusted from Rs. 360,000 to Rs. 331,200 (-Rs. 28,800, -8.0%)'
  },
  {
    id: 'ph-004',
    entity_type: 'PRICE',
    update_type: 'REGIONAL_OVERRIDE',
    product_id: 'p-002',
    product_code: 'GLS-TMP-10',
    product_name: '10mm Clear Tempered Architectural Glass',
    old_price: 12500,
    new_price: 13200,
    changed_by: 'Ruwan Senanayake (EMP-1003)',
    changed_by_role: 'Branch Manager',
    changed_date: '2026-09-06 09:40:00',
    reason: 'Hill Country freight surcharge and mountain logistics safety packaging',
    branch_affected: 'Kandy Hill Capital Branch',
    region_affected: 'Central Province',
    change_summary: 'Regional Override price set at Rs. 13,200 (Regional margin: +5.6% over Master Price)'
  },
  {
    id: 'ph-005',
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_MODIFICATION',
    quotation_id: 'qt-1003',
    quotation_number: 'INV-QT-2026-9114',
    customer_name: 'Blue Sky Beach Hotel',
    product_code: 'INV-QT-2026-9114',
    product_name: 'Coastal Resort Weatherproof Partitions',
    old_price: 195000,
    new_price: 245000,
    changed_by: 'Chaminda Silva (EMP-1004)',
    changed_by_role: 'Sales Executive',
    changed_date: '2026-09-05 15:10:30',
    reason: 'Customer expanded order scope to include 4 additional anodized window vents and coastal stainless fasteners',
    branch_affected: 'Galle Coastal & Port Hub',
    region_affected: 'Southern Province',
    change_summary: 'Line items expanded (4 items added) | Net Total updated from Rs. 195,000 to Rs. 245,000 (+Rs. 50,000)'
  },
  {
    id: 'ph-006',
    entity_type: 'PRICE',
    update_type: 'PRICE_CHANGE',
    product_id: 'p-003',
    product_code: 'ALU-PW-12',
    product_name: 'Powder Coated Casement Window Frame (1.2mm White)',
    old_price: 18000,
    new_price: 19500,
    changed_by: 'Eng. Nishantha Perera (EMP-1001)',
    changed_by_role: 'Super Admin',
    changed_date: '2026-09-04 10:05:18',
    reason: 'AkzoNobel architectural powder coating polymer price adjustment',
    branch_affected: 'All Branches',
    region_affected: 'Island-wide',
    change_summary: 'Master Base Price increased from Rs. 18,000 to Rs. 19,500 (+Rs. 1,500, +8.3%)'
  },
  {
    id: 'ph-007',
    entity_type: 'QUOTATION',
    update_type: 'QUOTATION_CREATED',
    quotation_id: 'qt-1004',
    quotation_number: 'INV-QT-2026-9205',
    customer_name: 'Dr. Rohan Wickramasinghe',
    product_code: 'INV-QT-2026-9205',
    product_name: 'Luxury Villa Residential Windows & Pergola',
    old_price: 0,
    new_price: 520000,
    changed_by: 'Chaminda Silva (EMP-1004)',
    changed_by_role: 'Sales Executive',
    changed_date: '2026-09-03 14:00:25',
    reason: 'Initial quotation drafted for luxury residential villa in Kurunegala',
    branch_affected: 'Kurunegala Industrial Hub',
    region_affected: 'North Western Province',
    change_summary: 'Draft Quotation created totaling Rs. 520,000 (8 window assemblies, transport cost Rs. 18,000)'
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'b-ho',
    code: 'HO',
    name: 'Head Office Admin Center',
    location: 'Central Master Server - Colombo 03',
    region: 'Head Office',
    status: 'Online',
    last_sync: 'Instant Live',
    active_users: 1,
    manager_name: 'System Admin (Master)',
    margin_pct: 0
  },
  {
    id: 'b-cmb',
    code: 'CMB',
    name: 'Colombo Port & City Sales',
    location: '344 Baseline Road, Colombo 09',
    region: 'Western Province',
    status: 'Online',
    last_sync: 'Connected (Live Push)',
    active_users: 0,
    manager_name: 'Colombo Branch Manager',
    margin_pct: 5
  },
  {
    id: 'b-kdy',
    code: 'KDY',
    name: 'Kandy Hill Capital Branch',
    location: '120 William Gopallawa Mawatha, Kandy',
    region: 'Central Province',
    status: 'Online',
    last_sync: 'Connected (Live Push)',
    active_users: 0,
    manager_name: 'Kandy Branch Manager',
    margin_pct: 15
  },
  {
    id: 'b-gle',
    code: 'GLE',
    name: 'Galle Coastal Hub',
    location: '88 Matara Road, Galle',
    region: 'Southern Province',
    status: 'Online',
    last_sync: 'Connected (Live Push)',
    active_users: 0,
    manager_name: 'Galle Branch Manager',
    margin_pct: 10
  },
  {
    id: 'b-jaf',
    code: 'JAF',
    name: 'Jaffna Regional Branch',
    location: '45 Kandy Road, Jaffna',
    region: 'Northern Province',
    status: 'Online',
    last_sync: 'Connected (Live Push)',
    active_users: 0,
    manager_name: 'Jaffna Branch Manager',
    margin_pct: 12
  }
];

export const INITIAL_BRANCH_PRICES: BranchPriceOverride[] = [];

export const INITIAL_CUSTOMER_PRICES: CustomerPriceOverride[] = [];

export const INITIAL_DISCOUNT_REQUESTS: DiscountApprovalRequest[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-van',
    type: 'Small Commercial Van (1 Ton)',
    capacity_kg: 1000,
    max_length_m: 3.5,
    base_charge: 3500,
    per_km_rate: 120,
    icon: 'truck'
  },
  {
    id: 'v-lorry',
    type: 'Medium Flatbed Lorry (5 Ton)',
    capacity_kg: 5000,
    max_length_m: 6.5,
    base_charge: 7500,
    per_km_rate: 250,
    icon: 'truck-heavy'
  },
  {
    id: 'v-trailer',
    type: 'Heavy Logistics Trailer (15 Ton)',
    capacity_kg: 15000,
    max_length_m: 12.0,
    base_charge: 15000,
    per_km_rate: 500,
    icon: 'container'
  }
];

export const INITIAL_TRANSPORT_RULES: TransportRules = {
  fuel_price_per_l: 350,
  driver_allowance: 3500,
  night_delivery_surcharge_pct: 15,
  remote_area_surcharge_pct: 20,
  min_distance_km: 10,
  base_fuel_rate: 350
};

export const INITIAL_LOCATIONS: SiteLocation[] = [
  // Western Province - Colombo District
  { id: 'loc-cmb-01', name: 'Colombo 01 (Fort)', district: 'Colombo', region: 'Western Province', distance_km: 5, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-03', name: 'Colombo 03 (Kollupitiya)', district: 'Colombo', region: 'Western Province', distance_km: 7, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-07', name: 'Colombo 07 (Cinnamon Gardens)', district: 'Colombo', region: 'Western Province', distance_km: 8, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-deh', name: 'Dehiwala-Mount Lavinia', district: 'Colombo', region: 'Western Province', distance_km: 14, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-nug', name: 'Nugegoda Metro', district: 'Colombo', region: 'Western Province', distance_km: 12, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-mah', name: 'Maharagama', district: 'Colombo', region: 'Western Province', distance_km: 16, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-mor', name: 'Moratuwa Commercial', district: 'Colombo', region: 'Western Province', distance_km: 22, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-hom', name: 'Homagama Hub', district: 'Colombo', region: 'Western Province', distance_km: 25, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-cmb-avi', name: 'Avissawella Industrial Zone', district: 'Colombo', region: 'Western Province', distance_km: 55, toll_charge: 0, risk_level: 'MEDIUM' },

  // Western Province - Gampaha District
  { id: 'loc-gmp-city', name: 'Gampaha Town', district: 'Gampaha', region: 'Western Province', distance_km: 32, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-gmp-neg', name: 'Negombo Coastal City', district: 'Gampaha', region: 'Western Province', distance_km: 38, toll_charge: 300, risk_level: 'LOW' },
  { id: 'loc-gmp-jae', name: 'Ja-Ela Commercial Zone', district: 'Gampaha', region: 'Western Province', distance_km: 24, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-gmp-wat', name: 'Wattala Mabola', district: 'Gampaha', region: 'Western Province', distance_km: 15, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-gmp-kel', name: 'Kelaniya Industrial Belt', district: 'Gampaha', region: 'Western Province', distance_km: 12, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-gmp-biy', name: 'Biyagama FTZ Export Zone', district: 'Gampaha', region: 'Western Province', distance_km: 25, toll_charge: 0, risk_level: 'LOW' },

  // Western Province - Kalutara District
  { id: 'loc-kal-city', name: 'Kalutara Town', district: 'Kalutara', region: 'Western Province', distance_km: 44, toll_charge: 350, risk_level: 'LOW' },
  { id: 'loc-kal-pan', name: 'Panadura Commercial', district: 'Kalutara', region: 'Western Province', distance_km: 28, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-kal-hor', name: 'Horana Industrial Zone', district: 'Kalutara', region: 'Western Province', distance_km: 42, toll_charge: 0, risk_level: 'LOW' },

  // Central Province - Kandy, Matale, Nuwara Eliya
  { id: 'loc-kdy-city', name: 'Kandy Metro City', district: 'Kandy', region: 'Central Province', distance_km: 115, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-kdy-per', name: 'Peradeniya Suburb', district: 'Kandy', region: 'Central Province', distance_km: 110, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-kdy-gam', name: 'Gampola Town', district: 'Kandy', region: 'Central Province', distance_km: 125, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-mtl-city', name: 'Matale Town', district: 'Matale', region: 'Central Province', distance_km: 145, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-mtl-dam', name: 'Dambulla Metro Hub', district: 'Matale', region: 'Central Province', distance_km: 165, toll_charge: 400, risk_level: 'LOW' },
  { id: 'loc-nue-city', name: 'Nuwara Eliya Hill City', district: 'Nuwara Eliya', region: 'Central Province', distance_km: 168, toll_charge: 400, risk_level: 'HIGH' },
  { id: 'loc-nue-hat', name: 'Hatton Commercial', district: 'Nuwara Eliya', region: 'Central Province', distance_km: 135, toll_charge: 0, risk_level: 'HIGH' },

  // Southern Province - Galle, Matara, Hambantota
  { id: 'loc-gle-city', name: 'Galle Fort & Harbor', district: 'Galle', region: 'Southern Province', distance_km: 125, toll_charge: 600, risk_level: 'LOW' },
  { id: 'loc-gle-hik', name: 'Hikkaduwa Coastal Belt', district: 'Galle', region: 'Southern Province', distance_km: 110, toll_charge: 500, risk_level: 'LOW' },
  { id: 'loc-mat-city', name: 'Matara City & Fort', district: 'Matara', region: 'Southern Province', distance_km: 160, toll_charge: 700, risk_level: 'LOW' },
  { id: 'loc-mat-wel', name: 'Weligama Coastal Town', district: 'Matara', region: 'Southern Province', distance_km: 145, toll_charge: 650, risk_level: 'LOW' },
  { id: 'loc-hbt-city', name: 'Hambantota Port City', district: 'Hambantota', region: 'Southern Province', distance_km: 235, toll_charge: 800, risk_level: 'LOW' },
  { id: 'loc-hbt-tan', name: 'Tangalle Town', district: 'Hambantota', region: 'Southern Province', distance_km: 195, toll_charge: 750, risk_level: 'LOW' },

  // North Western Province - Kurunegala, Puttalam
  { id: 'loc-kng-city', name: 'Kurunegala Junction City', district: 'Kurunegala', region: 'North Western Province', distance_km: 95, toll_charge: 400, risk_level: 'LOW' },
  { id: 'loc-kng-kul', name: 'Kuliyapitiya Town', district: 'Kurunegala', region: 'North Western Province', distance_km: 85, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-put-city', name: 'Puttalam Town', district: 'Puttalam', region: 'North Western Province', distance_km: 135, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-put-chl', name: 'Chilaw Coastal Zone', district: 'Puttalam', region: 'North Western Province', distance_km: 80, toll_charge: 0, risk_level: 'LOW' },

  // North Central Province - Anuradhapura, Polonnaruwa
  { id: 'loc-anp-city', name: 'Anuradhapura Sacred City', district: 'Anuradhapura', region: 'North Central Province', distance_km: 205, toll_charge: 400, risk_level: 'LOW' },
  { id: 'loc-pol-city', name: 'Polonnaruwa Kaduruwela', district: 'Polonnaruwa', region: 'North Central Province', distance_km: 220, toll_charge: 400, risk_level: 'LOW' },

  // Uva Province - Badulla, Monaragala
  { id: 'loc-bad-city', name: 'Badulla Town', district: 'Badulla', region: 'Uva Province', distance_km: 215, toll_charge: 400, risk_level: 'HIGH' },
  { id: 'loc-bad-ban', name: 'Bandarawela Resort', district: 'Badulla', region: 'Uva Province', distance_km: 195, toll_charge: 400, risk_level: 'HIGH' },
  { id: 'loc-mng-city', name: 'Monaragala Town', district: 'Monaragala', region: 'Uva Province', distance_km: 265, toll_charge: 400, risk_level: 'MEDIUM' },

  // Sabaragamuwa Province - Ratnapura, Kegalle
  { id: 'loc-rat-city', name: 'Ratnapura Gem City', district: 'Ratnapura', region: 'Sabaragamuwa Province', distance_km: 88, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-keg-city', name: 'Kegalle Town', district: 'Kegalle', region: 'Sabaragamuwa Province', distance_km: 78, toll_charge: 0, risk_level: 'LOW' },

  // Northern Province - Jaffna, Vavuniya, Kilinochchi, Mannar
  { id: 'loc-jaf-city', name: 'Jaffna Peninsula Metro', district: 'Jaffna', region: 'Northern Province', distance_km: 395, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-vav-city', name: 'Vavuniya Hub', district: 'Vavuniya', region: 'Northern Province', distance_km: 260, toll_charge: 400, risk_level: 'LOW' },
  { id: 'loc-kil-city', name: 'Kilinochchi Town', district: 'Kilinochchi', region: 'Northern Province', distance_km: 330, toll_charge: 400, risk_level: 'MEDIUM' },
  { id: 'loc-mnr-city', name: 'Mannar Town', district: 'Mannar', region: 'Northern Province', distance_km: 310, toll_charge: 0, risk_level: 'MEDIUM' },

  // Eastern Province - Trincomalee, Batticaloa, Ampara
  { id: 'loc-trn-city', name: 'Trincomalee Harbor Town', district: 'Trincomalee', region: 'Eastern Province', distance_km: 255, toll_charge: 400, risk_level: 'LOW' },
  { id: 'loc-btc-city', name: 'Batticaloa City', district: 'Batticaloa', region: 'Eastern Province', distance_km: 315, toll_charge: 0, risk_level: 'LOW' },
  { id: 'loc-amp-city', name: 'Ampara Town', district: 'Ampara', region: 'Eastern Province', distance_km: 320, toll_charge: 0, risk_level: 'LOW' }
];

export const INITIAL_SUPPLIERS: MaterialSupplier[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'Cinnamon Grand Colombo',
    phone: '+94 11 249 7200',
    email: 'procurement@cinnamonhotels.com',
    address: '77 Galle Road, Colombo 03',
    district_region: 'Western Province',
    customer_type: 'Developer',
    tax_id: 'VAT-4091283-7000',
    discount_tier_pct: 5,
    created_at: '2026-08-15'
  },
  {
    id: 'cust-002',
    name: 'Prime Residencies (Prime Lands Pvt Ltd)',
    phone: '+94 11 269 9822',
    email: 'projects@primelands.lk',
    address: '75 D.S. Senanayake Mawatha, Colombo 08',
    district_region: 'Western Province',
    customer_type: 'Developer',
    tax_id: 'VAT-9021849-7000',
    discount_tier_pct: 8,
    created_at: '2026-08-18'
  },
  {
    id: 'cust-003',
    name: 'Jetwing Lighthouse Resort',
    phone: '+94 91 222 3744',
    email: 'engineering@jetwinghotels.com',
    address: 'Dadella, Galle',
    district_region: 'Southern Province',
    customer_type: 'Architect',
    tax_id: 'VAT-3810294-7000',
    discount_tier_pct: 4,
    created_at: '2026-08-20'
  },
  {
    id: 'cust-004',
    name: 'Access Engineering PLC',
    phone: '+94 11 760 6600',
    email: 'supplychain@accessengsl.com',
    address: 'Access Towers, 278 Union Place, Colombo 02',
    district_region: 'Western Province',
    customer_type: 'Government',
    tax_id: 'VAT-10029384-7000',
    discount_tier_pct: 10,
    created_at: '2026-08-22'
  },
  {
    id: 'cust-005',
    name: 'Kandy Hill Luxury Villas',
    phone: '+94 81 223 4500',
    email: 'info@kandyvillas.lk',
    address: 'Rajapihilla Mawatha, Kandy',
    district_region: 'Central Province',
    customer_type: 'Retail Customer',
    tax_id: 'VAT-8492019-7000',
    discount_tier_pct: 0,
    created_at: '2026-08-25'
  },
  {
    id: 'cust-006',
    name: 'Jaffna Heritage Hotel',
    phone: '+94 21 222 3400',
    email: 'info@jaffnaheritage.com',
    address: 'Temple Road, Nallur, Jaffna',
    district_region: 'Northern Province',
    customer_type: 'Dealer',
    tax_id: 'VAT-5928103-7000',
    discount_tier_pct: 6,
    created_at: '2026-08-28'
  }
];

const now = new Date();
const getDateOffset = (daysAgo: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'qt-1001',
    quotation_number: 'INV-QT-2026-1001',
    barcode: 'INV-2026-1001',
    customer_name: 'Cinnamon Grand Colombo',
    customer_phone: '+94 11 249 7200',
    customer_email: 'procurement@cinnamonhotels.com',
    customer_address: '77 Galle Road, Colombo 03',
    site_address: 'Cinnamon Grand Ocean Wing Suite Renovations',
    site_location_name: 'Colombo 03',
    branch_id: 'b-ho',
    branch_code: 'HO',
    branch_name: 'Head Office Admin Center',
    date: getDateOffset(0),
    valid_until: getDateOffset(-30),
    status: 'Validated Official',
    items: [
      {
        id: 'qitem-1',
        product_id: 'prod-alu-slw-100',
        product_code: 'ALU-SLW-100',
        product_name: '100 Series Heavy Duty 2-Track Sliding Profile',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 12,
        unit_price: 18500,
        weight_kg: 69.6,
        total_price: 222000
      },
      {
        id: 'qitem-2',
        product_id: 'prod-gls-clr-10t',
        product_code: 'GLS-CLR-10T',
        product_name: '10mm Clear Toughened Frameless Glass Panel',
        category: 'Glass',
        unit: 'sq.ft',
        quantity: 40,
        unit_price: 2450,
        weight_kg: 1000,
        total_price: 98000
      },
      {
        id: 'qitem-3',
        product_id: 'prod-hdw-mor-lck',
        product_code: 'HDW-MOR-LCK',
        product_name: 'Multi-Point German Mortise Security Door Lock',
        category: 'Hardware & Accessories',
        unit: 'Unit',
        quantity: 6,
        unit_price: 4500,
        weight_kg: 7.2,
        total_price: 27000
      }
    ],
    material_subtotal: 347000,
    fabrication_cost: 20000,
    installation_cost: 15000,
    transport_cost: 3000,
    subtotal: 385000,
    subtotal_price: 385000,
    gross_total: 385000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 385000,
    external_software_ref: 'SAP-SO-90211',
    validated_at: getDateOffset(0) + 'T10:15:00.000Z',
    validated_by: 'System Admin (Master)',
    notes: 'Premium commercial glazing order with full safety glass certification.'
  },
  {
    id: 'qt-1002',
    quotation_number: 'INV-QT-2026-1002',
    barcode: 'INV-2026-1002',
    customer_name: 'Prime Residencies (Prime Lands Pvt Ltd)',
    customer_phone: '+94 11 269 9822',
    customer_email: 'projects@primelands.lk',
    customer_address: '75 D.S. Senanayake Mawatha, Colombo 08',
    site_address: 'Prime Residencies Kandy Luxury Tower Phase 1',
    site_location_name: 'Rajapihilla Mawatha, Kandy',
    branch_id: 'b-kdy',
    branch_code: 'KDY',
    branch_name: 'Kandy Hill Capital Branch',
    date: getDateOffset(1),
    valid_until: getDateOffset(-29),
    status: 'Validated Official',
    items: [
      {
        id: 'qitem-4',
        product_id: 'prod-alu-csm-45',
        product_code: 'ALU-CSM-45',
        product_name: '45mm Euro Casement Door Frame Profile',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 10,
        unit_price: 14200,
        weight_kg: 42.0,
        total_price: 142000
      },
      {
        id: 'qitem-5',
        product_id: 'prod-gls-clr-06t',
        product_code: 'GLS-CLR-06T',
        product_name: '6mm Clear Tempered Architectural Safety Glass',
        category: 'Glass',
        unit: 'sq.ft',
        quantity: 60,
        unit_price: 1250,
        weight_kg: 900,
        total_price: 75000
      },
      {
        id: 'qitem-6',
        product_id: 'prod-hdw-rolr-hvy',
        product_code: 'HDW-ROLR-HVY',
        product_name: 'Heavy Duty Stainless Steel Tandem Sliding Roller Set',
        category: 'Hardware & Accessories',
        unit: 'Unit',
        quantity: 12,
        unit_price: 2800,
        weight_kg: 9.6,
        total_price: 33600
      }
    ],
    material_subtotal: 250600,
    fabrication_cost: 10000,
    installation_cost: 7400,
    transport_cost: 0,
    subtotal: 268000,
    subtotal_price: 268000,
    gross_total: 268000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 268000,
    external_software_ref: 'SAP-SO-90214',
    validated_at: getDateOffset(1) + 'T14:30:00.000Z',
    validated_by: 'Kandy Branch Manager',
    notes: 'Approved casement framing package for luxury high-rise apartments.'
  },
  {
    id: 'qt-1003',
    quotation_number: 'INV-QT-2026-1003',
    barcode: 'INV-2026-1003',
    customer_name: 'Jetwing Lighthouse Resort',
    customer_phone: '+94 91 222 3744',
    customer_email: 'engineering@jetwinghotels.com',
    customer_address: 'Dadella, Galle',
    site_address: 'Jetwing Lighthouse Coastal Pavilion Exterior',
    site_location_name: 'Dadella, Galle',
    branch_id: 'b-gle',
    branch_code: 'GLE',
    branch_name: 'Galle Coastal Hub',
    date: getDateOffset(2),
    valid_until: getDateOffset(-28),
    status: 'Approved',
    items: [
      {
        id: 'qitem-7',
        product_id: 'prod-acp-met-04',
        product_code: 'ACP-MET-04',
        product_name: '4mm PVDF Metallic Silver ACP Cladding Sheet',
        category: 'ACP Sheets',
        unit: 'sheet',
        quantity: 15,
        unit_price: 8800,
        weight_kg: 277.5,
        total_price: 132000
      },
      {
        id: 'qitem-8',
        product_id: 'prod-alu-csm-45',
        product_code: 'ALU-CSM-45',
        product_name: '45mm Euro Casement Door Frame Profile',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 3,
        unit_price: 14200,
        weight_kg: 12.6,
        total_price: 42600
      },
      {
        id: 'qitem-9',
        product_id: 'prod-hdw-mor-lck',
        product_code: 'HDW-MOR-LCK',
        product_name: 'Multi-Point German Mortise Security Door Lock',
        category: 'Hardware & Accessories',
        unit: 'Unit',
        quantity: 4,
        unit_price: 4500,
        weight_kg: 4.8,
        total_price: 18000
      }
    ],
    material_subtotal: 192600,
    fabrication_cost: 2400,
    installation_cost: 0,
    transport_cost: 0,
    subtotal: 195000,
    subtotal_price: 195000,
    gross_total: 195000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 195000,
    notes: 'Marine-grade PVDF coastal exterior cladding refurbishment.'
  },
  {
    id: 'qt-1004',
    quotation_number: 'INV-QT-2026-1004',
    barcode: 'INV-2026-1004',
    customer_name: 'Access Engineering PLC',
    customer_phone: '+94 11 760 6600',
    customer_email: 'supplychain@accessengsl.com',
    customer_address: 'Access Towers, 278 Union Place, Colombo 02',
    site_address: 'Port City Financial Center Commercial Tower A',
    site_location_name: 'Colombo 01',
    branch_id: 'b-ho',
    branch_code: 'HO',
    branch_name: 'Head Office Admin Center',
    date: getDateOffset(4),
    valid_until: getDateOffset(-26),
    status: 'Pending HO Validation',
    items: [
      {
        id: 'qitem-10',
        product_id: 'prod-alu-slw-100',
        product_code: 'ALU-SLW-100',
        product_name: '100 Series Heavy Duty 2-Track Sliding Profile',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 15,
        unit_price: 18500,
        weight_kg: 87.0,
        total_price: 277500
      },
      {
        id: 'qitem-11',
        product_id: 'prod-gls-clr-10t',
        product_code: 'GLS-CLR-10T',
        product_name: '10mm Clear Toughened Frameless Glass Panel',
        category: 'Glass',
        unit: 'sq.ft',
        quantity: 45,
        unit_price: 2450,
        weight_kg: 1125,
        total_price: 110250
      },
      {
        id: 'qitem-12',
        product_id: 'prod-hdw-mor-lck',
        product_code: 'HDW-MOR-LCK',
        product_name: 'Multi-Point German Mortise Security Door Lock',
        category: 'Hardware & Accessories',
        unit: 'Unit',
        quantity: 8,
        unit_price: 4500,
        weight_kg: 9.6,
        total_price: 36000
      }
    ],
    material_subtotal: 423750,
    fabrication_cost: 16250,
    installation_cost: 0,
    transport_cost: 0,
    subtotal: 440000,
    subtotal_price: 440000,
    gross_total: 440000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 440000,
    notes: 'Awaiting head office structural engineering signoff.'
  },
  {
    id: 'qt-1005',
    quotation_number: 'INV-QT-2026-1005',
    barcode: 'INV-2026-1005',
    customer_name: 'Jaffna Heritage Hotel',
    customer_phone: '+94 21 222 3400',
    customer_email: 'info@jaffnaheritage.com',
    customer_address: 'Temple Road, Nallur, Jaffna',
    site_address: 'Jaffna Heritage Convention Hall Expansion',
    site_location_name: 'Nallur, Jaffna',
    branch_id: 'b-jaf',
    branch_code: 'JAF',
    branch_name: 'Jaffna Regional Branch',
    date: getDateOffset(6),
    valid_until: getDateOffset(-24),
    status: 'Temporary Branch Draft',
    items: [
      {
        id: 'qitem-13',
        product_id: 'p-1788770949553',
        product_code: 'AL8972',
        product_name: 'Architectural Glazing Section AL8972',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 8,
        unit_price: 12500,
        weight_kg: 36.0,
        total_price: 100000
      },
      {
        id: 'qitem-14',
        product_id: 'prod-gls-clr-06t',
        product_code: 'GLS-CLR-06T',
        product_name: '6mm Clear Tempered Architectural Safety Glass',
        category: 'Glass',
        unit: 'sq.ft',
        quantity: 30,
        unit_price: 1250,
        weight_kg: 450,
        total_price: 37500
      },
      {
        id: 'qitem-15',
        product_id: 'prod-hdw-rolr-hvy',
        product_code: 'HDW-ROLR-HVY',
        product_name: 'Heavy Duty Stainless Steel Tandem Sliding Roller Set',
        category: 'Hardware & Accessories',
        unit: 'Unit',
        quantity: 5,
        unit_price: 2800,
        weight_kg: 4.0,
        total_price: 14000
      }
    ],
    material_subtotal: 151500,
    fabrication_cost: 4500,
    installation_cost: 0,
    transport_cost: 0,
    subtotal: 156000,
    subtotal_price: 156000,
    gross_total: 156000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 156000,
    notes: 'Draft branch quote submitted by Northern regional representative.'
  },
  {
    id: 'qt-1006',
    quotation_number: 'INV-QT-2026-1006',
    barcode: 'INV-2026-1006',
    customer_name: 'Kandy Hill Luxury Villas',
    customer_phone: '+94 81 223 4500',
    customer_email: 'info@kandyvillas.lk',
    customer_address: 'Rajapihilla Mawatha, Kandy',
    site_address: 'Hilltop Villa Suite 4 Panoramic View Enclosure',
    site_location_name: 'Rajapihilla Mawatha, Kandy',
    branch_id: 'b-kdy',
    branch_code: 'KDY',
    branch_name: 'Kandy Hill Capital Branch',
    date: getDateOffset(8),
    valid_until: getDateOffset(-22),
    status: 'Validated Official',
    items: [
      {
        id: 'qitem-16',
        product_id: 'prod-alu-slw-100',
        product_code: 'ALU-SLW-100',
        product_name: '100 Series Heavy Duty 2-Track Sliding Profile',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 10,
        unit_price: 18500,
        weight_kg: 58.0,
        total_price: 185000
      },
      {
        id: 'qitem-17',
        product_id: 'p-1788770949553',
        product_code: 'AL8972',
        product_name: 'Architectural Glazing Section AL8972',
        category: 'Aluminium Profiles',
        unit: 'bar',
        quantity: 6,
        unit_price: 12500,
        weight_kg: 27.0,
        total_price: 75000
      },
      {
        id: 'qitem-18',
        product_id: 'prod-gls-clr-06t',
        product_code: 'GLS-CLR-06T',
        product_name: '6mm Clear Tempered Architectural Safety Glass',
        category: 'Glass',
        unit: 'sq.ft',
        quantity: 35,
        unit_price: 1250,
        weight_kg: 525,
        total_price: 43750
      }
    ],
    material_subtotal: 303750,
    fabrication_cost: 8250,
    installation_cost: 0,
    transport_cost: 0,
    subtotal: 312000,
    subtotal_price: 312000,
    gross_total: 312000,
    discount_amount: 0,
    tax_amount: 0,
    net_total: 312000,
    external_software_ref: 'SAP-SO-90208',
    validated_at: getDateOffset(8) + 'T11:45:00.000Z',
    validated_by: 'Kandy Branch Manager',
    notes: 'Completed delivery and signoff for luxury villa project.'
  }
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  company_name: 'INNOVISTA ALUMINIUM & GLASS POS SYSTEM',
  tagline: 'Enterprise Architectural Systems & Multi-Branch Network',
  logo_url: '/frontend/assets/images/pos_logo_banner_1786169189051.jpg',
  registration_no: 'PV-98234-SL',
  tax_vat_id: 'VAT-10029384-7000',
  phone: '+94 11 288 9000 / +94 77 345 6789',
  email: 'info@innovistapos.lk',
  address: 'No. 102 Innovista Tower, Nawala Road, Rajagiriya, Colombo',
  website: 'www.innovistapos.lk',
  bank_details: {
    bank_name: 'Commercial Bank of Ceylon PLC',
    account_number: '1000-849201-001',
    account_name: 'Innovista Aluminium & Glass Systems (Pvt) Ltd',
    branch_name: 'Nawala Corporate Branch',
    swift_code: 'CCEYLKCX'
  },
  currencies: [
    { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee', exchange_rate_to_lkr: 1.0, is_default: true },
    { code: 'USD', symbol: '$', name: 'US Dollar', exchange_rate_to_lkr: 308.50, is_default: false },
    { code: 'EUR', symbol: '€', name: 'Euro', exchange_rate_to_lkr: 335.20, is_default: false },
    { code: 'AED', symbol: 'AED', name: 'UAE Dirham', exchange_rate_to_lkr: 84.00, is_default: false }
  ],
  invoice_footer_terms: '1. All prices are valid for 14 days from date of issue.\n2. 50% advance payment required upon order confirmation.\n3. Goods once sold are non-refundable unless verified for manufacturing defect within 7 days.',
  timezone: 'Asia/Colombo',
  ho_backup_key: 'HO-MASTER-EMERGENCY-2026-X89B',
  ho_backup_key_status: 'Active',
  ho_backup_key_updated_at: new Date().toISOString().split('T')[0],
  ho_backup_key_updated_by: 'Nishantha Perera (HO Super Admin)',
  ho_backup_key_notes: 'Master emergency recovery key for resetting user accounts when standard recovery is unavailable.'
};

export const INITIAL_USERS: SystemUser[] = [
  {
    id: 'user-001',
    employee_id: 'EMP-1001',
    name: 'Nishantha Perera',
    email: 'admin@innovistapos.lk',
    role: 'Super Admin',
    branch_id: 'b-ho',
    branch_name: 'Head Office Admin Center',
    status: 'Active',
    phone: '+94 77 111 2222',
    created_at: new Date().toISOString().split('T')[0],
    last_login: 'Never',
    mustChangePassword: false,
    mfaEnabled: false,
    mfaType: 'authenticator',
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    password: 'admin123',
    critical_pin: 'A9HF-4K28@',
    mfaBackupCodes: ['A9HF-4K28', 'B92M-HD76', 'QJ82-KP19', 'M7K9-LX83', 'P3W2-VJ91', 'T4R8-BY65']
  },
  {
    id: 'user-cmb-01',
    employee_id: 'EMP-CMB01',
    name: 'Suresh Fernando (Colombo Admin)',
    email: 'cmb.admin@innovistapos.lk',
    role: 'Branch Manager',
    branch_id: 'b-cmb',
    branch_name: 'Colombo Port & City Sales',
    status: 'Active',
    phone: '+94 77 222 3344',
    created_at: new Date().toISOString().split('T')[0],
    last_login: 'Never',
    mustChangePassword: false,
    mfaEnabled: false,
    mfaType: 'authenticator',
    mfaSecret: 'JBSWY3DPEHPK3PXA',
    password: 'admin123',
    mfaBackupCodes: ['CMB1-9988', 'CMB2-8877', 'CMB3-7766', 'CMB4-6655']
  },
  {
    id: 'user-kdy-01',
    employee_id: 'EMP-KDY01',
    name: 'Nuwan Bandara (Kandy Admin)',
    email: 'kdy.admin@innovistapos.lk',
    role: 'Branch Manager',
    branch_id: 'b-kdy',
    branch_name: 'Kandy Hill Capital Branch',
    status: 'Active',
    phone: '+94 77 333 4455',
    created_at: new Date().toISOString().split('T')[0],
    last_login: 'Never',
    mustChangePassword: false,
    mfaEnabled: false,
    mfaType: 'authenticator',
    mfaSecret: 'JBSWY3DPEHPK3PXB',
    password: 'admin123',
    mfaBackupCodes: ['KDY1-9988', 'KDY2-8877', 'KDY3-7766', 'KDY4-6655']
  },
  {
    id: 'user-gle-01',
    employee_id: 'EMP-GLE01',
    name: 'Charith De Silva (Galle Admin)',
    email: 'gle.admin@innovistapos.lk',
    role: 'Branch Manager',
    branch_id: 'b-gle',
    branch_name: 'Galle Coastal Hub',
    status: 'Active',
    phone: '+94 77 444 5566',
    created_at: new Date().toISOString().split('T')[0],
    last_login: 'Never',
    mustChangePassword: false,
    mfaEnabled: false,
    mfaType: 'authenticator',
    mfaSecret: 'JBSWY3DPEHPK3PXC',
    password: 'admin123',
    mfaBackupCodes: ['GLE1-9988', 'GLE2-8877', 'GLE3-7766', 'GLE4-6655']
  },
  {
    id: 'user-jaf-01',
    employee_id: 'EMP-JAF01',
    name: 'Tharshan Yogarajah (Jaffna Admin)',
    email: 'jaf.admin@innovistapos.lk',
    role: 'Branch Manager',
    branch_id: 'b-jaf',
    branch_name: 'Jaffna Regional Branch',
    status: 'Active',
    phone: '+94 77 555 6677',
    created_at: new Date().toISOString().split('T')[0],
    last_login: 'Never',
    mustChangePassword: false,
    mfaEnabled: false,
    mfaType: 'authenticator',
    mfaSecret: 'JBSWY3DPEHPK3PXD',
    password: 'admin123',
    mfaBackupCodes: ['JAF1-9988', 'JAF2-8877', 'JAF3-7766', 'JAF4-6655']
  }
];

export const INITIAL_CATEGORIES: CategoryConfig[] = [
  {
    id: 'cat-1',
    name: 'Aluminium Profiles',
    description: 'Extruded architectural aluminium profiles & framing systems',
    status: 'Active',
    subcategories: [
      { id: 'sub-cat-1-1', name: 'Sliding Door Profiles', status: 'Active' },
      { id: 'sub-cat-1-2', name: 'Casement Window Profiles', status: 'Active' },
      { id: 'sub-cat-1-3', name: 'Curtain Wall Mulleins', status: 'Active' },
      { id: 'sub-cat-1-4', name: 'Partition Channels', status: 'Active' },
      { id: 'sub-cat-1-5', name: 'Louvers', status: 'Active' }
    ]
  },
  {
    id: 'cat-2',
    name: 'Architectural Glass',
    description: 'High performance float, tempered, laminated, and double glazed panels',
    status: 'Active',
    subcategories: [
      { id: 'sub-cat-2-1', name: 'Clear Float Glass', status: 'Active' },
      { id: 'sub-cat-2-2', name: 'Tinted Solar Glass', status: 'Active' },
      { id: 'sub-cat-2-3', name: 'Tempered Glass', status: 'Active' },
      { id: 'sub-cat-2-4', name: 'Laminated Glass', status: 'Active' },
      { id: 'sub-cat-2-5', name: 'Double Glazed Units (DGU)', status: 'Active' }
    ]
  },
  {
    id: 'cat-3',
    name: 'Hardware & Accessories',
    description: 'Locks, rollers, hinges, weatherstrips, silicones and installation fittings',
    status: 'Active',
    subcategories: [
      { id: 'sub-cat-3-1', name: 'Multi-point Locks', status: 'Active' },
      { id: 'sub-cat-3-2', name: 'Heavy Rollers', status: 'Active' },
      { id: 'sub-cat-3-3', name: 'Friction Hinges', status: 'Active' },
      { id: 'sub-cat-3-4', name: 'Structural Silicone', status: 'Active' },
      { id: 'sub-cat-3-5', name: 'EPDM Gaskets', status: 'Active' }
    ]
  },
  {
    id: 'cat-4',
    name: 'Composite & Cladding',
    description: 'Aluminium Composite Panels (ACP) & exterior facade materials',
    status: 'Active',
    subcategories: [
      { id: 'sub-cat-4-1', name: 'PVDF Exterior ACP', status: 'Active' },
      { id: 'sub-cat-4-2', name: 'PE Interior ACP', status: 'Active' },
      { id: 'sub-cat-4-3', name: 'Perforated Mesh', status: 'Active' }
    ]
  }
];

export const INITIAL_CUSTOMER_TYPES: CustomerTypeConfig[] = [
  { id: 'ct-1', name: 'Company', default_discount_pct: 5, description: 'Corporate Clients & Registered Businesses' },
  { id: 'ct-2', name: 'Distributor', default_discount_pct: 8, description: 'Wholesale Fabricators & Authorized Distributors' },
  { id: 'ct-3', name: 'Developer', default_discount_pct: 6, description: 'Real Estate Developers & Large Scale Contractors' },
  { id: 'ct-4', name: 'Retail Customer', default_discount_pct: 0, description: 'Individual Walk-in Retail Buyers' },
  { id: 'ct-5', name: 'Architect', default_discount_pct: 5, description: 'Architectural Consultants & Interior Designers' }
];

export const INITIAL_LOCATION_CONFIGS: LocationConfig[] = [
  { id: 'loc-1', name: 'Colombo Municipal Zone', district: 'Colombo', region: 'Western Province', status: 'Active' },
  { id: 'loc-2', name: 'Gampaha Industrial Belt', district: 'Gampaha', region: 'Western Province', status: 'Active' },
  { id: 'loc-3', name: 'Kandy Urban Metro', district: 'Kandy', region: 'Central Province', status: 'Active' },
  { id: 'loc-4', name: 'Galle Coastal Corridor', district: 'Galle', region: 'Southern Province', status: 'Active' },
  { id: 'loc-5', name: 'Kurunegala Junction', district: 'Kurunegala', region: 'North Western', status: 'Active' },
  { id: 'loc-6', name: 'Jaffna Northern Hub', district: 'Jaffna', region: 'Northern Province', status: 'Active' }
];
