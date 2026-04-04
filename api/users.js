import { list, put } from '@vercel/blob';

const USERS_PREFIX = 'oigaippr-blob/users/';
const USERS_FILE = `${USERS_PREFIX}accounts.json`;

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const normalizeUsers = (users) => {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter((u) => u && Number.isFinite(u.id) && typeof u.username === 'string' && typeof u.assignedMethod === 'string')
    .map((u) => ({
      id: Number(u.id),
      username: String(u.username),
      avatar: typeof u.avatar === 'string' ? u.avatar : undefined,
      assignedMethod: String(u.assignedMethod),
      role: u.role === 'admin' ? 'admin' : 'user',
    }));
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const page = await list({ prefix: USERS_FILE, limit: 1 });
      const blob = page.blobs[0];

      if (!blob) {
        return res.status(200).json({ ok: true, users: [], source: 'empty' });
      }

      const blobResponse = await fetch(blob.url, { method: 'GET' });
      if (!blobResponse.ok) {
        return res.status(502).json({ error: 'Failed to read users blob' });
      }

      const data = await blobResponse.json();
      const users = normalizeUsers(data?.users);
      return res.status(200).json({ ok: true, users, source: 'blob' });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    }
  }

  try {
    const users = normalizeUsers(req.body?.users);
    const payload = {
      savedAt: new Date().toISOString(),
      users,
    };

    const blob = await put(USERS_FILE, JSON.stringify(payload, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return res.status(201).json({ ok: true, users, blobUrl: blob.url, pathname: blob.pathname });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save users',
    });
  }
}
