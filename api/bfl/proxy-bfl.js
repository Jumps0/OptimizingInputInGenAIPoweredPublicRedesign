export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'POST') {
    try {
      const {
        prompt,
        encoded_image,
        encoded_mask,
        model = 'flux-2-klein-9b',
        steps,
        guidance,
        output_format,
        api_key,
      } = req.body;
      const key = process.env.BFL_API_KEY;// || api_key;

      if (!key) {
        return res.status(400).json({ error: 'Missing BFL API key. Set BFL_API_KEY on the server or pass api_key in the request body.' });
      }

      if (!prompt || !encoded_image) {
        return res.status(400).json({ error: 'Missing prompt or encoded_image in request body.' });
      }

      const endpoint = `https://api.bfl.ai/v1/${model}`;
      const requestBody = {
        prompt,
        image: encoded_image,
        input_image: encoded_image,
      };

      if (encoded_mask) {
        requestBody.input_mask = encoded_mask;
        requestBody.mask = encoded_mask;
      }
      if (steps !== undefined) {
        requestBody.steps = steps;
      }
      if (guidance !== undefined) {
        requestBody.guidance = guidance;
      }
      if (output_format) {
        requestBody.output_format = output_format;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      return res.status(response.ok ? 200 : 502).json(data);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { id, polling_url, api_key } = req.query;
      const key = process.env.BFL_API_KEY || api_key;

      if (!key) {
        return res.status(400).json({ error: 'Missing BFL API key. Set BFL_API_KEY on the server or pass api_key as a query parameter.' });
      }

      if (!id && !polling_url) {
        return res.status(400).json({ error: 'Missing id or polling_url query parameter.' });
      }

      const url = polling_url || `https://api.bfl.ai/v1/get_result?id=${id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-key': key,
        },
      });

      const data = await response.json();
      return res.status(response.ok ? 200 : 502).json(data);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}
