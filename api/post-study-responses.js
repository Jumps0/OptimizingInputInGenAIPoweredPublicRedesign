import { put } from '@vercel/blob';

const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, responses, createdAt } = req.body || {};

    if (!Number.isFinite(userId) || !responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Invalid payload. Expected userId:number and responses:object.' });
    }

    const timestamp = createdAt || new Date().toISOString();
    const safeTimestamp = String(timestamp).replace(/[:.]/g, '-');
    const filePath = `oigaippr-blob/post-study-responses/${safeTimestamp}-user-${userId}.json`;

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
