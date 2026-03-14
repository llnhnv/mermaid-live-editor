import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const userId = url.searchParams.get('user_id');
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const offset = Number(url.searchParams.get('offset') ?? 0);

  let rows: unknown[];
  let count: number;

  if (userId) {
    const result = await pool.query(
      'SELECT * FROM diagrams WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*)::int FROM diagrams WHERE user_id = $1', [
      userId
    ]);
    rows = result.rows;
    count = countResult.rows[0].count;
  } else {
    const result = await pool.query(
      'SELECT * FROM diagrams ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*)::int FROM diagrams');
    rows = result.rows;
    count = countResult.rows[0].count;
  }

  return json({ diagrams: rows, count });
};

export const POST: RequestHandler = async ({ request }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const { code, config, short_id, title, user_id } = await request.json();

  const result = await pool.query(
    'INSERT INTO diagrams (code, config, short_id, title, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [code, config ?? null, short_id, title ?? null, user_id ?? null]
  );

  return json(result.rows[0]);
};
