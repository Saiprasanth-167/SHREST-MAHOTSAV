const qr = require('qrcode');

module.exports = async (req, res) => {
  // You can make these dynamic if needed
  const upiId = "your-upi-id@okphonepe";
  const name = "SHREST MAHOTSAV";
  const amount = 100; // You can make this dynamic if needed
  const note = "Event Registration Fee";

  // UPI QR format
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  try {
    const qrUrl = await qr.toDataURL(upiString);
    res.json({ success: true, qrUrl, upi: { upiId, name, amount, note } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate UPI QR', error: err.message });
  }
};
