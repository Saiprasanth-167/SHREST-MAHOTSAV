const qr = require('qrcode');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get dynamic params from query
  const upiId = req.query.pa || process.env.UPI_ID || "6305369920@ybl";
  const name = req.query.pn || process.env.UPI_NAME || "TATA ANANTHA VENKATA";
  const amount = req.query.am || 100;
  const note = req.query.tn || "SHREST-MAHOTSAV_2K25 Registration Fee";
  const txnRef = req.query.tr || "SHREST" + Date.now();

  // UPI QR format
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(txnRef)}`;
  try {
    // If ?json=1, return JSON with base64 QR
    if (req.query.json === '1') {
      const qrUrl = await qr.toDataURL(upiString);
      return res.json({ success: true, qrUrl, upi: { upiId, name, amount, note, txnRef } });
    }
    // Otherwise, return PNG image
    res.setHeader('Content-Type', 'image/png');
    await qr.toFileStream(res, upiString, { type: 'png', width: 300 });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate UPI QR', error: err.message });
    }
  }
};
