module.exports = async (req, res) => {
  try {
    const backendBase = process.env.BACKEND_URL;
    if (!backendBase) {
      res.status(500).json({ success: false, message: 'BACKEND_URL not configured' });
      return;
    }

    const tail = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '');
    const base = backendBase.replace(/\/+$/, '');
    const search = req.url.includes('?') ? '?' + req.url.split('?').slice(1).join('?') : '';
    const targetUrl = `${base}/${tail}${search}`;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    let body;
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (d) => chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d)));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
      if (body && body.length === 0) body = undefined;
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      const k = String(key).toLowerCase();
      if (k === 'transfer-encoding' || k === 'content-length') return;
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    res.status(502).json({ success: false, message: 'Proxy error', error: String(err && err.message ? err.message : err) });
  }
};
