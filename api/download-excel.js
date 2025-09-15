const _fetch = (globalThis.fetch ? ((...a) => globalThis.fetch(...a)) : require('node-fetch'));

module.exports = async (req, res) => {
	try {
		const base = (process.env.BACKEND_BASE_URL || '').replace(/\/$/, '');
		if (!base) {
			res.status(500).send('BACKEND_BASE_URL not configured');
			return;
		}
		const upstream = await _fetch(base + '/download-excel');
		res.status(upstream.status);
		const ct = upstream.headers.get('content-type');
		if (ct) res.setHeader('content-type', ct);
		const disp = upstream.headers.get('content-disposition');
		if (disp) res.setHeader('content-disposition', disp);
		const ab = await upstream.arrayBuffer();
		res.send(Buffer.from(ab));
	} catch (err) {
		res.status(502).send('Proxy error: ' + (err && err.message ? err.message : String(err)));
	}
};

