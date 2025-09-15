module.exports = async (req, res) => {
	try {
		const base = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '');
		if (!base) {
			res.status(500).send('BACKEND_BASE_URL not configured');
			return;
		}
		const url = base + '/live-excel';
		const headers = { ...req.headers };
		delete headers.host;
		delete headers['content-length'];
		let body;
		const method = (req.method || 'GET').toUpperCase();
		if (!['GET', 'HEAD'].includes(method)) {
			if (req.body == null) {
				body = await new Promise((resolve, reject) => {
					const chunks = [];
					req.on('data', c => chunks.push(c));
					req.on('end', () => resolve(Buffer.concat(chunks)));
					req.on('error', reject);
				});
			} else if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
				body = req.body;
			} else {
				body = JSON.stringify(req.body);
				headers['content-type'] = headers['content-type'] || 'application/json';
			}
		}
		const upstream = await fetch(url, { method, headers, body, redirect: 'manual' });
		const ct = upstream.headers.get('content-type') || '';
		res.status(upstream.status);
		if (ct) res.setHeader('content-type', ct);
		const disp = upstream.headers.get('content-disposition');
		if (disp) res.setHeader('content-disposition', disp);
		const cc = upstream.headers.get('cache-control');
		if (cc) res.setHeader('cache-control', cc);
		const ab = await upstream.arrayBuffer();
		res.send(Buffer.from(ab));
	} catch (err) {
		res.status(502).send('Proxy error: ' + (err && err.message ? err.message : String(err)));
	}
};

