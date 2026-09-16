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
  Customer, 
  CompanySettings, 
  SystemUser, 
  CategoryConfig, 
  CustomerTypeConfig, 
  LocationConfig 
} from '../shared/types';
import { getPostgresDiagnostics, PostgresDiagnostics, loadAllFromPostgres } from './postgresDb';
import { pool } from '../src/db/index.ts';

export interface FullDatabaseState {
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

export type LocalDbDiagnostics = PostgresDiagnostics;

export async function getDatabaseDiagnostics(): Promise<PostgresDiagnostics> {
  return await getPostgresDiagnostics();
}

export async function loadStateFromPostgres(): Promise<FullDatabaseState | null> {
  try {
    return await loadAllFromPostgres();
  } catch (err: any) {
    console.error('Failed to load state from PostgreSQL:', err);
    return null;
  }
}

export function getPostgresDbConfig() {
  const host = process.env.AWS_EC2_POSTGRES_HOST || process.env.AWS_RDS_POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'AWS EC2 Instance Host / IP';
  const database = process.env.AWS_EC2_POSTGRES_DATABASE || process.env.AWS_RDS_POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'innovista_aws_db';
  const user = process.env.AWS_EC2_POSTGRES_USER || process.env.AWS_RDS_POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';
  const port = process.env.AWS_EC2_POSTGRES_PORT || process.env.AWS_RDS_POSTGRES_PORT || process.env.PGPORT || '5432';
  const region = process.env.AWS_EC2_REGION || process.env.AWS_RDS_REGION || 'us-east-1';
  const instanceId = process.env.AWS_EC2_INSTANCE_ID || 'i-innovista-ec2-node';

  return {
    provider: 'AWS EC2 PostgreSQL',
    engine: 'AWS EC2 Linux Instance (Self-Hosted PostgreSQL Relational Engine)',
    region,
    instanceId,
    host: `${host}:${port}`,
    database,
    user,
    sslMode: (process.env.AWS_EC2_POSTGRES_SSL === 'true' || process.env.AWS_RDS_POSTGRES_SSL === 'true') ? 'require' : 'disable'
  };
}

export async function executeRawPostgresQuery(queryText: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(queryText, params);
    return res;
  } finally {
    client.release();
  }
}
