require('dotenv').config();
const nodemailer = require('nodemailer');
const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

async function sendOtp(email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return { success: false, message: 'Invalid email.' };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your SHREST MAHOTSAV OTP Code',
            text: `Your OTP code for registration is ${otp}`
        });
        return { success: true, message: 'OTP sent to email.' };
    } catch (err) {
        console.error('Nodemailer error:', err);
        return { success: false, message: 'Failed to send OTP.' };
    }
}

function verifyOtp(email, otp) {
    if (otpStore[email] && otpStore[email] === otp) {
        delete otpStore[email];
        return { success: true };
    } else {
        return { success: false, message: 'Incorrect OTP.' };
    }
}

module.exports = { sendOtp, verifyOtp };