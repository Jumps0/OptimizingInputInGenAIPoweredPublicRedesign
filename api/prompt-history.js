import { del, list, put } from '@vercel/blob';

const PROMPT_HISTORY_PREFIX = 'oigaippr-blob/prompt-history/';

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'DELETE') {
    try {
      const { blobPath, id } = req.body || {};
      let pathToDelete = typeof blobPath === 'string' && blobPath.trim() ? blobPath.trim() : null;

      if (!pathToDelete && Number.isFinite(id)) {
        let cursor;
        let hasMore = true;

        while (hasMore && !pathToDelete) {
          const page = await list({
            prefix: PROMPT_HISTORY_PREFIX,
            cursor,
            limit: 1000,
          });

          for (const blob of page.blobs) {
            const blobResponse = await fetch(blob.url, { method: 'GET' });
            if (!blobResponse.ok) {
              continue;
            }

            const payload = await blobResponse.json().catch(() => null);
            if (payload && Number(payload.id) === Number(id)) {
              pathToDelete = blob.pathname;
              break;
            }
          }

          hasMore = page.hasMore;
          cursor = page.cursor;
        }
      }

      if (!pathToDelete) {
        return res.status(404).json({ error: 'Prompt history blob not found' });
      }

      await del(pathToDelete);
      return res.status(200).json({ ok: true, deletedPath: pathToDelete });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to delete prompt history item',
      });
    }
  }

  if (req.method === 'GET') {
    try {
      let cursor;
      let hasMore = true;
      const blobs = [];

      while (hasMore) {
        const page = await list({
          prefix: PROMPT_HISTORY_PREFIX,
          cursor,
          limit: 1000,
        });

        blobs.push(...page.blobs);
        hasMore = page.hasMore;
        cursor = page.cursor;
      }

      const history = (
        await Promise.all(
          blobs.map(async (blob) => {
            try {
              const blobResponse = await fetch(blob.url, { method: 'GET' });
              if (!blobResponse.ok) {
                return null;
              }

              const payload = await blobResponse.json();
              if (!payload || typeof payload !== 'object') {
                return null;
              }

              return {
                id: Number(payload.id) || Date.now(),
                projectId: Number(payload.projectId) || 0,
                userId: Number(payload.userId),
                prompt: String(payload.prompt || ''),
                inputImage: String(payload.inputImage || ''),
                outputImage: String(payload.outputImage || ''),
                version: Number(payload.version) || 1,
                timestamp: String(payload.timestamp || new Date().toISOString()),
                likes: Array.isArray(payload.likes) ? payload.likes : [],
                comments: Array.isArray(payload.comments) ? payload.comments : [],
                blobPath: blob.pathname,
              };
            } catch {
              return null;
            }
          })
        )
      )
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
      return res.status(400).json({ error: 'Invalid payload. Expected prompt history entry with userId and prompt.' });
    }

    const timestamp = entry.timestamp || new Date().toISOString();
    const safeTimestamp = String(timestamp).replace(/[:.]/g, '-');
    const filePath = `${PROMPT_HISTORY_PREFIX}${safeTimestamp}-user-${entry.userId}-history-${entry.id || Date.now()}.json`;

    const payload = {
      ...entry,
      timestamp,
      likes: Array.isArray(entry.likes) ? entry.likes : [],
      comments: Array.isArray(entry.comments) ? entry.comments : [],
    };

    const blob = await put(filePath, JSON.stringify(payload, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });

    return res.status(201).json({
      ok: true,
      blobUrl: blob.url,
      pathname: blob.pathname,
      history: payload,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save prompt history',
    });
  }
}
