const { verifyOtp } = require('../backend.js');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  const { email, otp } = req.body;
  const result = verifyOtp(email, otp);
  res.json(result);
};