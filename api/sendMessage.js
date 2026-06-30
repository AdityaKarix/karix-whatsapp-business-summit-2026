export default async function handler(req, res) {
  const WA_URL = 'https://rcmapi.instaalerts.zone/services/rcm/sendMessage';
  const WA_AUTH = process.env.WA_AUTH; // e.g. 'Bearer mF45RVx0zDWSWpSFRY6UwA=='

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authentication');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!WA_AUTH) {
    res.status(500).json({ error: 'WA_AUTH environment variable is not set on the server.' });
    return;
  }

  try {
    const body = req.body;

    const r = await fetch(WA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authentication': WA_AUTH
      },
      body: JSON.stringify(body)
    });

    console.log('[sendMessage] upstream status=', r.status);
    const text = await r.text();

    // Mirror status + body back to caller
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    try {
      const json = JSON.parse(text);
      res.status(r.status).json(json);
    } catch (e) {
      res.status(r.status).send(text);
    }
  } catch (err) {
    console.error('[sendMessage] proxy error', err);
    res.status(500).json({ error: err.message });
  }
}
