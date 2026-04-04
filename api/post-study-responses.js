import { list, put } from '@vercel/blob';

const POST_STUDY_PREFIX = 'oigaippr-blob/post-study-responses/';

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      let cursor;
      let hasMore = true;
      const blobs = [];

      while (hasMore) {
        const page = await list({
          prefix: POST_STUDY_PREFIX,
          cursor,
          limit: 1000,
        });

        blobs.push(...page.blobs);
        hasMore = page.hasMore;
        cursor = page.cursor;
      }

      const responses = (
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

              const createdAt =
                typeof payload.createdAt === 'string'
                  ? payload.createdAt
                  : new Date(blob.uploadedAt || Date.now()).toISOString();

              return {
                id: Number.isFinite(payload.id) ? payload.id : Date.parse(createdAt),
                userId: Number(payload.userId),
                createdAt,
                responses: payload.responses && typeof payload.responses === 'object' ? payload.responses : {},
              };
            } catch {
              return null;
            }
          })
        )
      )
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
      return res.status(400).json({ error: 'Invalid payload. Expected userId:number and responses:object.' });
    }

    const timestamp = createdAt || new Date().toISOString();
    const safeTimestamp = String(timestamp).replace(/[:.]/g, '-');
    const filePath = `${POST_STUDY_PREFIX}${safeTimestamp}-user-${userId}.json`;

    const payload = {
      id: Date.now(),
      userId,
      createdAt: timestamp,
      responses,
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
      response: payload,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to save post-study response',
    });
  }
}
