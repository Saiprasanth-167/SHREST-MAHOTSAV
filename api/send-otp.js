const { sendOtp } = require('../backend.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  const { email } = req.body;
  try {
    const result = await sendOtp(email);
    res.json(result);
  } catch (err) {
    console.error('Unexpected error in /api/send-otp:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};