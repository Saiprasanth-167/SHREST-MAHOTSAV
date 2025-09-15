module.exports = (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }
    try {
        const pa = process.env.UPI_VPA || '';
        const pn = process.env.UPI_NAME || 'SHREST MAHOTSAV';
        if (!pa) {
            return res.status(500).json({ success: false, message: 'UPI account not configured.' });
        }
        res.json({ success: true, pa, pn });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.', error: e.message });
    }
};