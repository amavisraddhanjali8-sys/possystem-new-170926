import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.AWS_EC2_POSTGRES_URL || process.env.AWS_RDS_POSTGRES_URL || process.env.DATABASE_URL;
    const host = process.env.AWS_EC2_POSTGRES_HOST || process.env.AWS_RDS_POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || 'localhost';
    const port = Number(process.env.AWS_EC2_POSTGRES_PORT || process.env.AWS_RDS_POSTGRES_PORT || process.env.PGPORT || 5432);
    const user = process.env.AWS_EC2_POSTGRES_USER || process.env.AWS_RDS_POSTGRES_USER || process.env.PGUSER || process.env.SQL_USER || 'postgres';
    const password = process.env.AWS_EC2_POSTGRES_PASSWORD || process.env.AWS_RDS_POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.SQL_PASSWORD || '';
    const database = process.env.AWS_EC2_POSTGRES_DATABASE || process.env.AWS_RDS_POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || 'innovista_aws_db';

    const isUnixSocket = typeof host === 'string' && host.startsWith('/');
    const useSsl = !isUnixSocket && (process.env.AWS_EC2_POSTGRES_SSL === 'true' || process.env.AWS_RDS_POSTGRES_SSL === 'true');

    const poolConfig: PoolConfig = connectionString
      ? {
          connectionString,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          max: 10,
          connectionTimeoutMillis: 15000,
        }
      : {
          host,
          port,
          user,
          password,
          database,
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          max: 10,
          connectionTimeoutMillis: 15000,
        };

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle AWS EC2 PostgreSQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { pool };
export * from './schema.ts';
