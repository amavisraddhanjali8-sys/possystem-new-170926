import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const sqlHost = process.env.AWS_EC2_POSTGRES_HOST || process.env.AWS_RDS_POSTGRES_HOST || process.env.PGHOST || process.env.SQL_HOST || "localhost";
const sqlDbName = process.env.AWS_EC2_POSTGRES_DATABASE || process.env.AWS_RDS_POSTGRES_DATABASE || process.env.PGDATABASE || process.env.SQL_DB_NAME || "innovista_aws_db";
const user = process.env.AWS_EC2_POSTGRES_USER || process.env.AWS_RDS_POSTGRES_USER || process.env.PGUSER || process.env.SQL_ADMIN_USER || process.env.SQL_USER || "postgres";
const password = process.env.AWS_EC2_POSTGRES_PASSWORD || process.env.AWS_RDS_POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || "";
const port = Number(process.env.AWS_EC2_POSTGRES_PORT || process.env.AWS_RDS_POSTGRES_PORT || process.env.PGPORT || 5432);

const isUnixSocket = typeof sqlHost === "string" && sqlHost.startsWith("/");
const isSsl = process.env.AWS_EC2_POSTGRES_SSL === "true" || process.env.AWS_RDS_POSTGRES_SSL === "true";
const sslConfig = !isUnixSocket && isSsl ? { rejectUnauthorized: false } : false;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost,
    port,
    user,
    password,
    database: sqlDbName,
    ssl: sslConfig,
  },
  verbose: true,
});

