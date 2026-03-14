import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const result = await pool.query('SELECT * FROM diagrams WHERE short_id = $1', [params.shortId]);

  if (result.rows.length === 0) {
    return json({ error: 'Diagram not found' }, { status: 404 });
  }

  return json(result.rows[0]);
};

export const PUT: RequestHandler = async ({ params, request }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const { code, config, title, user_id } = await request.json();

  const result = await pool.query(
    'UPDATE diagrams SET code = $1, config = $2, title = $3 WHERE short_id = $4 AND user_id = $5 RETURNING *',
    [code, config ?? null, title ?? null, params.shortId, user_id]
  );

  if (result.rows.length === 0) {
    return json({ error: 'Diagram not found or unauthorized' }, { status: 404 });
  }

  return json(result.rows[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  await pool.query('DELETE FROM diagrams WHERE short_id = $1', [params.shortId]);

  return json({ success: true });
};
