// Disabled: OTP verification is no longer required
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  res.json({ success: true, message: 'OTP verification disabled.' });
};
