// Development endpoint to get OTP when email fails on Render
const { otpStore } = require('../backend.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  // For Render testing - return the OTP if it exists
  const otp = otpStore[email];
  if (otp) {
    return res.json({ 
      email, 
      otp: otp,
      message: 'OTP retrieved for testing' 
    });
  } else {
    return res.json({ 
      email, 
      otp: null,
      message: 'No OTP found - request OTP first' 
    });
  }
};