import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Retorna colunas do tipo DATE (OID 1082) diretamente como string 'YYYY-MM-DD',
// evitando conversão para objeto Date local que gera shifts de fuso e strings 'Sun Oct 11'
types.setTypeParser(1082, (val) => val);

// Connection string provided for internal cloud deployment
const DEFAULT_DATABASE_URL = 'postgres://pga_snk_plug:jaIFJADOFJADppga@plug_sales_dispatch_app_pga_snk:5432/pga_snk?sslmode=disable';

/**
 * Robust parser for PostgreSQL URLs that correctly handles passwords with special characters (like '@')
 */
export function parsePostgresUrl(rawUrl) {
  if (!rawUrl) return null;
  const match = rawUrl.match(/^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:\/]+)(?::(\d+))?\/([^?]+)(?:\?(.*))?$/);
  if (match) {
    const [, user, password, host, port, database, queryStr] = match;
    const isSslDisable = queryStr && queryStr.includes('sslmode=disable');
    const isSslRequire = queryStr && (queryStr.includes('sslmode=require') || queryStr.includes('ssl=true'));
    return {
      user: decodeURIComponent(user),
      password: decodeURIComponent(password),
      host,
      port: port ? parseInt(port, 10) : 5432,
      database,
      ssl: isSslDisable ? false : (isSslRequire ? { rejectUnauthorized: false } : false)
    };
  }
  return null;
}

// Build configuration: prioritize environment variables, fallback to DEFAULT_DATABASE_URL
const connectionUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
const parsedUrl = parsePostgresUrl(connectionUrl) || {};

export const poolConfig = {
  user: process.env.DB_USER || parsedUrl.user || 'pga_snk_plug',
  password: process.env.DB_PASSWORD || parsedUrl.password || 'jaIFJADOFJADppga',
  host: process.env.DB_HOST || parsedUrl.host || 'plug_sales_dispatch_app_pga_snk',
  port: parseInt(process.env.DB_PORT || String(parsedUrl.port || 5432), 10),
  database: process.env.DB_NAME || parsedUrl.database || 'pga_snk',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : (parsedUrl.ssl || false),
  max: 20, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

export const pool = new Pool(poolConfig);

// Keep track of connection health
let isDbConnected = false;
let lastError = null;

pool.on('error', (err) => {
  console.error('⚠️ [PostgreSQL Pool Error]:', err.message);
  isDbConnected = false;
  lastError = err.message;
});

/**
 * Execute a query with parameters
 */
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    isDbConnected = true;
    lastError = null;
    return res;
  } catch (error) {
    lastError = error.message;
    throw error;
  }
}

/**
 * Test connectivity and measure latency
 */
export async function testConnection() {
  const start = Date.now();
  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name, version() as pg_version');
    const latencyMs = Date.now() - start;
    isDbConnected = true;
    lastError = null;
    return {
      connected: true,
      latencyMs,
      database: res.rows[0].db_name,
      serverTime: res.rows[0].current_time,
      pgVersion: res.rows[0].pg_version,
      config: {
        host: poolConfig.host,
        port: poolConfig.port,
        database: poolConfig.database,
        user: poolConfig.user
      }
    };
  } catch (error) {
    isDbConnected = false;
    lastError = error.message;
    return {
      connected: false,
      error: error.message,
      config: {
        host: poolConfig.host,
        port: poolConfig.port,
        database: poolConfig.database,
        user: poolConfig.user
      }
    };
  }
}

export function getDbStatus() {
  return {
    connected: isDbConnected,
    lastError,
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user
  };
}
