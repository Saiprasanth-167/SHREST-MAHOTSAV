const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Create transporter using environment variables
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'SHREST MAHOTSAV Test Email',
    text: 'This is a test email from SHREST MAHOTSAV.',
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email delivered to ${email}`);
    res.status(200).json({ success: true, message: `Email delivered to ${email}` });
  } catch (error) {
    console.error('Email delivery failed:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
};
