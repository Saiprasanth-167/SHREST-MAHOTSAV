const QRCode = require('qrcode');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }
    try {
        const pa = process.env.UPI_VPA;
        const pn = process.env.UPI_NAME || 'SHREST MAHOTSAV';
        const am = String(req.query.am || '').trim();
        const tn = String(req.query.tn || '').trim();
        const tr = String(req.query.tr || '').trim();

        if (!pa) return res.status(400).send('UPI VPA not configured');
        if (!am || isNaN(Number(am)) || Number(am) <= 0) return res.status(400).send('Invalid amount');

        const params = new URLSearchParams();
        params.set('pa', pa);
        if (pn) params.set('pn', pn);
        params.set('am', String(Number(am)));
        params.set('cu', 'INR');
        if (tn) params.set('tn', tn);
        if (tr) params.set('tr', tr);

        const url = 'upi://pay?' + params.toString();
        const buf = await QRCode.toBuffer(url, { width: 520, margin: 1 });

        res.setHeader('Content-Type', 'image/png');
        res.send(buf);
    } catch (e) {
        console.error('Error in /api/upi-qr:', e);
        res.status(500).send('Failed to generate QR');
    }
};