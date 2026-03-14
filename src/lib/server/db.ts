import pg from 'pg';

const { Pool } = pg;

// DATABASE_URL must be set in Vercel project environment variables
const databaseUrl = process.env['DATABASE_URL'];

export const isDbEnabled = !!databaseUrl;

export const pool = isDbEnabled ? new Pool({ connectionString: databaseUrl }) : null;
