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
        image,
        input_image,
        input_mask,
        mask,
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

      const imageData = encoded_image || image || input_image;
      if (!prompt || !imageData) {
        return res.status(400).json({ error: 'Missing prompt or image data in request body.' });
      }

      const endpoint = `https://api.bfl.ai/v1/${model}`;
      const requestBody = {
        prompt,
        image: imageData,
        input_image: imageData,
      };

      const maskData = encoded_mask || mask || input_mask;
      if (maskData) {
        requestBody.mask = maskData;
        requestBody.input_mask = maskData;
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
      const { id, polling_url, image_url, api_key } = req.query;

      if (image_url) {
        const imageResponse = await fetch(String(image_url));
        if (!imageResponse.ok) {
          return res.status(502).json({
            error: `Failed to fetch remote image: ${imageResponse.status} ${imageResponse.statusText}`,
          });
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

        return res.status(200).json({ base64, contentType });
      }

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
