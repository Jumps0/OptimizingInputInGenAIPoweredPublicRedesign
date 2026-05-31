import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_ROOT = process.env.DATA_ROOT || path.join(process.cwd(), 'data');

app.use(express.json({ limit: '50mb' }));

const allowedOrigins = new Set([
  'https://oigaippr2.vercel.app', // Replace this with vercel app URL
  'http://localhost:5173',
  'http://localhost:4173',
]);

const setCommonHeaders = (req, res, methods) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const readJsonFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const writeJsonFile = (filePath, payload) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
};

const deleteFileIfExists = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const listJsonFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name);
};

const toPosixPath = (...parts) => parts.join('/');

const USERS_DIR = path.join(DATA_ROOT, 'users');
const USERS_FILE = path.join(USERS_DIR, 'accounts.json');
const USERS_PATHNAME = 'users/accounts.json';

const PROMPT_HISTORY_DIR = path.join(DATA_ROOT, 'prompt-history');
const POST_STUDY_DIR = path.join(DATA_ROOT, 'post-study-responses');

const ALLOWED_METHODS = new Set(['text', 'voice', 'inpainting', 'dragdrop']);

const normalizeUsers = (users) => {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter(
      (user) =>
        user &&
        Number.isFinite(user.id) &&
        typeof user.username === 'string' &&
        typeof user.assignedMethod === 'string' &&
        ALLOWED_METHODS.has(String(user.assignedMethod))
    )
    .map((user) => ({
      id: Number(user.id),
      username: String(user.username).trim().toLowerCase(),
      avatar: typeof user.avatar === 'string' ? user.avatar : undefined,
      assignedMethod: String(user.assignedMethod),
      role: user.role === 'admin' ? 'admin' : 'user',
    }));
};

const userKey = (user) => String(user.username || '').trim().toLowerCase();

const loadUsers = () => {
  const data = readJsonFile(USERS_FILE);
  if (!data) {
    return { users: [], source: 'empty' };
  }

  return {
    users: normalizeUsers(data.users),
    source: 'file',
  };
};

const writeUsers = (users) => {
  const payload = {
    savedAt: new Date().toISOString(),
    users,
  };

  writeJsonFile(USERS_FILE, payload);

  return {
    pathname: USERS_PATHNAME,
  };
};

const mergeUsers = (existingUsers, incomingUsers) => {
  const byUsername = new Map(existingUsers.map((user) => [userKey(user), user]));

  for (const user of incomingUsers) {
    byUsername.set(userKey(user), user);
  }

  return Array.from(byUsername.values());
};

const upsertUser = (existingUsers, incomingUser) => {
  const key = userKey(incomingUser);
  const users = [...existingUsers];

  const indexByUsername = users.findIndex((user) => userKey(user) === key);
  const indexById = users.findIndex((user) => user.id === incomingUser.id);
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

app.all('/api/users', (req, res) => {
  setCommonHeaders(req, res, 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const { users, source } = loadUsers();
      return res.status(200).json({ ok: true, users, source });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      });
    }
  }

  try {
    const { users: existingUsers } = loadUsers();
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

      nextUsers = existingUsers.filter((user) => {
        if (hasId && user.id === userId) {
          return false;
        }
        if (hasUsername && userKey(user) === username) {
          return false;
        }
        return true;
      });
    } else if (operation === 'rename') {
      const userId = Number(req.body?.userId);
      const newUsernameRaw =
        typeof req.body?.newUsername === 'string' ? req.body.newUsername.trim().toLowerCase() : '';

      if (!Number.isFinite(userId) || !newUsernameRaw) {
        return res.status(400).json({ error: 'rename operation requires userId and newUsername' });
      }

      const duplicate = existingUsers.find((user) => userKey(user) === newUsernameRaw && user.id !== userId);
      if (duplicate) {
        return res.status(409).json({ error: 'Target username is already in use' });
      }

      let renamed = false;
      nextUsers = existingUsers.map((user) => {
        if (user.id !== userId) {
          return user;
        }
        renamed = true;
        return { ...user, username: newUsernameRaw };
      });

      if (!renamed) {
        return res.status(404).json({ error: 'User not found for rename' });
      }
    } else {
      const incomingUsers = normalizeUsers(req.body?.users);
      nextUsers = mergeUsers(existingUsers, incomingUsers);
    }

    const file = writeUsers(nextUsers);

    return res.status(200).json({
      ok: true,
      users: nextUsers,
      pathname: file.pathname,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save users',
    });
  }
});

app.all('/api/prompt-history', (req, res) => {
  setCommonHeaders(req, res, 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'DELETE') {
    try {
      const { blobPath, id } = req.body || {};
      let pathToDelete = typeof blobPath === 'string' && blobPath.trim() ? blobPath.trim() : null;

      if (!pathToDelete && Number.isFinite(id)) {
        const fileNames = listJsonFiles(PROMPT_HISTORY_DIR);

        for (const fileName of fileNames) {
          const pathname = toPosixPath('prompt-history', fileName);
          const payload = readJsonFile(path.join(PROMPT_HISTORY_DIR, fileName));
          if (payload && Number(payload.id) === Number(id)) {
            pathToDelete = pathname;
            break;
          }
        }
      }

      if (!pathToDelete) {
        return res.status(404).json({ error: 'Prompt history entry not found' });
      }

      deleteFileIfExists(path.join(DATA_ROOT, pathToDelete));
      return res.status(200).json({ ok: true, deletedPath: pathToDelete });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete prompt history item',
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const history = listJsonFiles(PROMPT_HISTORY_DIR)
        .map((fileName) => {
          try {
            const payload = readJsonFile(path.join(PROMPT_HISTORY_DIR, fileName));
            if (!payload || typeof payload !== 'object') {
              return null;
            }

            const normalizedOutputImages = Array.isArray(payload.outputImages)
              ? payload.outputImages.map((item) => String(item || '')).filter(Boolean)
              : Array.isArray(payload.allOutputImages)
                ? payload.allOutputImages.map((item) => String(item || '')).filter(Boolean)
                : [];

            const normalizedSelectedIndex = Number.isFinite(payload.selectedOutputIndex)
              ? Number(payload.selectedOutputIndex)
              : Number.isFinite(payload.selectedImageIndex)
                ? Number(payload.selectedImageIndex)
                : undefined;

            const normalizedOutputImage = String(payload.outputImage || '') || normalizedOutputImages[0] || '';

            return {
              id: Number(payload.id) || Date.now(),
              projectId: Number(payload.projectId) || 0,
              userId: Number(payload.userId),
              username: String(payload.username || ''),
              prompt: String(payload.prompt || ''),
              inputImage: String(payload.inputImage || ''),
              outputImage: normalizedOutputImage,
              outputImages: normalizedOutputImages.length > 0 ? normalizedOutputImages : undefined,
              selectedOutputIndex: normalizedSelectedIndex,
              version: Number(payload.version) || 1,
              timestamp: String(payload.timestamp || new Date().toISOString()),
              blobPath: toPosixPath('prompt-history', fileName),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return res.status(200).json({ ok: true, history, count: history.length });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch prompt history',
      });
    }
  }

  try {
    const entry = req.body || {};

    if (!Number.isFinite(entry.userId) || typeof entry.prompt !== 'string') {
      return res
        .status(400)
        .json({ error: 'Invalid payload. Expected prompt history entry with userId and prompt.' });
    }

    const timestamp = entry.timestamp || new Date().toISOString();
    const safeTimestamp = String(timestamp).replace(/[:.]/g, '-');
    const fileName = `${safeTimestamp}-user-${entry.userId}-history-${entry.id || Date.now()}.json`;
    const pathname = toPosixPath('prompt-history', fileName);

    const payload = {
      ...entry,
      username: String(entry.username || ''),
      timestamp,
    };

    writeJsonFile(path.join(PROMPT_HISTORY_DIR, fileName), payload);

    return res.status(201).json({
      ok: true,
      pathname,
      history: payload,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save prompt history',
    });
  }
});

app.all('/api/post-study-responses', (req, res) => {
  setCommonHeaders(req, res, 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'DELETE') {
    try {
      const { blobPath, id } = req.body || {};
      let pathToDelete = typeof blobPath === 'string' && blobPath.trim() ? blobPath.trim() : null;

      if (!pathToDelete && Number.isFinite(id)) {
        const fileNames = listJsonFiles(POST_STUDY_DIR);

        for (const fileName of fileNames) {
          const pathname = toPosixPath('post-study-responses', fileName);
          const payload = readJsonFile(path.join(POST_STUDY_DIR, fileName));
          if (payload && Number(payload.id) === Number(id)) {
            pathToDelete = pathname;
            break;
          }
        }
      }

      if (!pathToDelete) {
        return res.status(404).json({ error: 'Post-study response not found' });
      }

      deleteFileIfExists(path.join(DATA_ROOT, pathToDelete));
      return res.status(200).json({ ok: true, deletedPath: pathToDelete });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete post-study response item',
      });
    }
  }

  if (req.method === 'GET') {
    try {
      const responses = listJsonFiles(POST_STUDY_DIR)
        .map((fileName) => {
          try {
            const payload = readJsonFile(path.join(POST_STUDY_DIR, fileName));
            if (!payload || typeof payload !== 'object') {
              return null;
            }

            const createdAt =
              typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString();

            return {
              id: Number.isFinite(payload.id) ? payload.id : Date.parse(createdAt),
              userId: Number(payload.userId),
              createdAt,
              responses:
                payload.responses && typeof payload.responses === 'object' ? payload.responses : {},
              blobPath: toPosixPath('post-study-responses', fileName),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.status(200).json({ ok: true, responses, count: responses.length });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to fetch post-study responses',
      });
    }
  }

  try {
    const { userId, responses, createdAt } = req.body || {};

    if (!Number.isFinite(userId) || !responses || typeof responses !== 'object') {
      return res.status(400).json({
        error: 'Invalid payload. Expected userId:number and responses:object.',
      });
    }

    const timestamp = createdAt || new Date().toISOString();
    const safeTimestamp = String(timestamp).replace(/[:.]/g, '-');
    const fileName = `${safeTimestamp}-user-${userId}.json`;
    const pathname = toPosixPath('post-study-responses', fileName);

    const payload = {
      id: Date.now(),
      userId,
      createdAt: timestamp,
      responses,
    };

    writeJsonFile(path.join(POST_STUDY_DIR, fileName), payload);

    return res.status(201).json({
      ok: true,
      pathname,
      response: payload,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save post-study response',
    });
  }
});

app.get('/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true });
});

app.listen(PORT, HOST, () => {
  console.log(`Data API listening on http://${HOST}:${PORT}`);
  console.log(`Data root: ${DATA_ROOT}`);
});
