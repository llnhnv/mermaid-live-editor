import { json } from '@sveltejs/kit';
import { pool } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!pool) {
    return json({ error: 'Database not configured' }, { status: 503 });
  }

  const { username, password } = await request.json();

  const result = await pool.query(
    'SELECT id, username FROM users WHERE username = $1 AND password = $2',
    [username, password]
  );

  if (result.rows.length === 0) {
    return json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return json(result.rows[0]);
};
