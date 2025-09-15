require('dotenv').config();
const nodemailer = require('nodemailer');
const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    secure: false,
    connectionTimeout: 30000,
    tls: {
        rejectUnauthorized: false
    }
});

async function sendOtp(email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return { success: false, message: 'Invalid email.' };
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    
    try {
        const emailPromise = transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your SHREST MAHOTSAV OTP Code',
            text: `Your OTP code for registration is ${otp}`,
            html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
        });
        
        const timeout = process.env.RENDER ? 10000 : 30000;
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), timeout)
        );
        
        await Promise.race([emailPromise, timeoutPromise]);
        return { success: true, message: 'OTP sent to email.' };
    } catch (err) {
        // On Render, allow registration to continue even if email fails
        if (process.env.RENDER) {
            return { success: true, message: 'Registration proceeding - check email or contact admin.' };
        }
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
