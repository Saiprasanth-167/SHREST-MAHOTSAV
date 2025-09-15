require('dotenv').config();
const nodemailer = require('nodemailer');
const otpStore = {};

console.log('Initializing email transporter...');
console.log('Email user:', process.env.EMAIL);
console.log('Password configured:', !!process.env.PASSWORD);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Transporter verification failed:', error);
    } else {
        console.log('Email server is ready to take our messages');
    }
});

async function sendOtp(email) {
    console.log('Attempting to send OTP to:', email);
    console.log('Email config - FROM:', process.env.EMAIL);
    
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        console.log('Invalid email format:', email);
        return { success: false, message: 'Invalid email.' };
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    console.log('Generated OTP:', otp, 'for email:', email);
    
    try {
        console.log('Sending email via nodemailer...');
        const result = await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your SHREST MAHOTSAV OTP Code',
            text: `Your OTP code for registration is ${otp}`,
            html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
        });
        console.log('Email sent successfully:', result.messageId);
        return { success: true, message: 'OTP sent to email.' };
    } catch (err) {
        console.error('Nodemailer error details:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        return { success: false, message: 'Failed to send OTP: ' + err.message };
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
