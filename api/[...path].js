const { URL } = require('url');
const _fetch = (globalThis.fetch ? ((...a) => globalThis.fetch(...a)) : require('node-fetch'));

module.exports = async (req, res) => {
  try {
    const backend = process.env.BACKEND_BASE_URL;
    if (!backend) {
      res.status(500).json({ success: false, message: 'BACKEND_BASE_URL not configured' });
      return;
    }

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const base = backend.replace(/\/$/, '');
  const first = segments[0] || '';
  const passthroughRoots = new Set(['qrcodes', 'live-excel', 'download-excel']);
  const needsApiPrefix = first && !passthroughRoots.has(first);
  const destPath = (needsApiPrefix ? '/api' : '') + (segments.length ? '/' + segments.join('/') : '');

    const incomingUrl = new URL(req.url, 'http://placeholder');
    const destUrl = new URL(base + destPath);
    if (incomingUrl.search) destUrl.search = incomingUrl.search;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    let body;
    const method = (req.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method)) {
      if (req.body == null) {
        // Attempt to read raw body if not parsed
        body = await new Promise((resolve, reject) => {
          let data = [];
          req.on('data', chunk => data.push(chunk));
          req.on('end', () => resolve(Buffer.concat(data)));
          req.on('error', reject);
        });
      } else if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
        body = req.body;
      } else {
        body = JSON.stringify(req.body);
        headers['content-type'] = headers['content-type'] || 'application/json';
      }
    }

  const upstream = await _fetch(destUrl.toString(), {
      method,
      headers,
      body,
      redirect: 'manual'
    });

    const ct = upstream.headers.get('content-type') || '';
    res.status(upstream.status);
    if (ct) res.setHeader('content-type', ct);
    const cc = upstream.headers.get('cache-control');
    if (cc) res.setHeader('cache-control', cc);

    if (ct.includes('application/json')) {
      const json = await upstream.json().catch(async () => ({ raw: await upstream.text() }));
      res.send(json);
    } else {
      const ab = await upstream.arrayBuffer();
      res.send(Buffer.from(ab));
    }
  } catch (err) {
    res.status(502).json({ success: false, message: 'Proxy error', error: String(err && err.message || err) });
  }
};
