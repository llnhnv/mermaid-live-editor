import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export const isDbEnabled = !!databaseUrl;

export const pool = isDbEnabled ? new Pool({ connectionString: databaseUrl }) : null;
