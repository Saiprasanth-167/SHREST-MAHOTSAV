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
    // Generate QR as data URL (base64)
    const qrDataUrl = await qr.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
    });
    
    // Return JSON with base64 QR for easy frontend consumption
    res.status(200).json({ 
      success: true, 
      qrUrl: qrDataUrl,
      upi: { pa: upiId, pn: name, amount, note, txnRef } 
    });
  } catch (err) {
    console.error('UPI QR generation error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate UPI QR', 
        error: err.message 
      });
    }
  }
};
