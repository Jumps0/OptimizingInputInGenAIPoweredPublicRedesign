import { list, put } from '@vercel/blob';

const USERS_PREFIX = 'oigaippr-blob/users/';
const USERS_FILE = `${USERS_PREFIX}accounts.json`;
const ALLOWED_METHODS = new Set(['text', 'voice', 'inpainting', 'dragdrop']);

const setCorsHeaders = (res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const normalizeUsers = (users) => {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter(
      (u) =>
        u &&
        Number.isFinite(u.id) &&
        typeof u.username === 'string' &&
        typeof u.assignedMethod === 'string' &&
        ALLOWED_METHODS.has(String(u.assignedMethod))
    )
    .map((u) => ({
      id: Number(u.id),
      username: String(u.username).trim().toLowerCase(),
      avatar: typeof u.avatar === 'string' ? u.avatar : undefined,
      assignedMethod: String(u.assignedMethod),
      role: u.role === 'admin' ? 'admin' : 'user',
    }));
};

const userKey = (user) => String(user.username || '').trim().toLowerCase();

const loadUsersFromBlob = async () => {
  const page = await list({ prefix: USERS_FILE, limit: 1 });
  const blob = page.blobs[0];

  if (!blob) {
    return { users: [], source: 'empty' };
  }

  const blobResponse = await fetch(blob.url, { method: 'GET' });
  if (!blobResponse.ok) {
    throw new Error('Failed to read users blob');
  }

  const data = await blobResponse.json();
  return {
    users: normalizeUsers(data?.users),
    source: 'blob',
  };
};

const mergeUsers = (existingUsers, incomingUsers) => {
  const byUsername = new Map(existingUsers.map((u) => [userKey(u), u]));

  for (const user of incomingUsers) {
    byUsername.set(userKey(user), user);
  }

  return Array.from(byUsername.values());
};

const upsertUser = (existingUsers, incomingUser) => {
  const key = userKey(incomingUser);
  const users = [...existingUsers];

  const indexByUsername = users.findIndex((u) => userKey(u) === key);
  const indexById = users.findIndex((u) => u.id === incomingUser.id);
  const updateIndex = indexByUsername !== -1 ? indexByUsername : indexById;

  if (updateIndex !== -1) {
    const existing = users[updateIndex];
    users[updateIndex] = {
      ...existing,
      ...incomingUser,
      id: existing.id,
      username: key,
    };
    return users;
  }

  users.push({ ...incomingUser, username: key });
  return users;
};

const writeUsersToBlob = async (users) => {
  const payload = {
    savedAt: new Date().toISOString(),
    users,
  };

  return put(USERS_FILE, JSON.stringify(payload, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
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
      const { users, source } = await loadUsersFromBlob();
      return res.status(200).json({ ok: true, users, source });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    }
  }

  try {
    const { users: existingUsers } = await loadUsersFromBlob();
    const operation = typeof req.body?.operation === 'string' ? req.body.operation : 'merge';

    let nextUsers = existingUsers;

    if (operation === 'replace') {
      const incomingUsers = normalizeUsers(req.body?.users);
      const allowDestructive = req.body?.allowDestructive === true;
      const isDestructive = existingUsers.length > 0 && incomingUsers.length < existingUsers.length;

      if (isDestructive && !allowDestructive) {
        return res.status(409).json({
          error: 'Rejected destructive replace without allowDestructive flag',
          existingCount: existingUsers.length,
          incomingCount: incomingUsers.length,
        });
      }

      nextUsers = incomingUsers;
    } else if (operation === 'upsert') {
      const incomingUser = normalizeUsers([req.body?.user])[0];
      if (!incomingUser) {
        return res.status(400).json({ error: 'Invalid user payload for upsert' });
      }
      nextUsers = upsertUser(existingUsers, incomingUser);
    } else if (operation === 'remove') {
      const userId = Number(req.body?.userId);
      const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
      const hasId = Number.isFinite(userId);
      const hasUsername = Boolean(username);

      if (!hasId && !hasUsername) {
        return res.status(400).json({ error: 'remove operation requires userId or username' });
      }

      nextUsers = existingUsers.filter((u) => {
        if (hasId && u.id === userId) {
          return false;
        }
        if (hasUsername && userKey(u) === username) {
          return false;
        }
        return true;
      });
    } else if (operation === 'rename') {
      const userId = Number(req.body?.userId);
      const newUsernameRaw = typeof req.body?.newUsername === 'string' ? req.body.newUsername.trim().toLowerCase() : '';

      if (!Number.isFinite(userId) || !newUsernameRaw) {
        return res.status(400).json({ error: 'rename operation requires userId and newUsername' });
      }

      const duplicate = existingUsers.find((u) => userKey(u) === newUsernameRaw && u.id !== userId);
      if (duplicate) {
        return res.status(409).json({ error: 'Target username is already in use' });
      }

      let renamed = false;
      nextUsers = existingUsers.map((u) => {
        if (u.id !== userId) {
          return u;
        }
        renamed = true;
        return { ...u, username: newUsernameRaw };
      });

      if (!renamed) {
        return res.status(404).json({ error: 'User not found for rename' });
      }
    } else {
      const incomingUsers = normalizeUsers(req.body?.users);
      nextUsers = mergeUsers(existingUsers, incomingUsers);
    }

    const blob = await writeUsersToBlob(nextUsers);
    console.info('[users] write', {
      operation,
      existingCount: existingUsers.length,
      nextCount: nextUsers.length,
    });

    return res.status(200).json({ ok: true, users: nextUsers, blobUrl: blob.url, pathname: blob.pathname });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save users',
    });
  }
}
