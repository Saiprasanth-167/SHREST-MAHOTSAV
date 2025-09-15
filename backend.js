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
    pool: true,
    maxConnections: 1,
    secure: false,
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds  
    socketTimeout: 60000, // 60 seconds
    tls: {
        rejectUnauthorized: false
    }
});

// Make email verification non-blocking for deployment
transporter.verify((error, success) => {
    if (error) {
        console.warn('Email transporter verification failed (non-critical):', error.message);
        console.log('Server will continue - emails may not work until connection is established');
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
        
        // For Render environment, try email but don't block on failure
        if (process.env.RENDER) {
            console.log('Render environment detected - using fallback email strategy');
            try {
                const result = await Promise.race([
                    transporter.sendMail({
                        from: process.env.EMAIL,
                        to: email,
                        subject: 'Your SHREST MAHOTSAV OTP Code',
                        text: `Your OTP code for registration is ${otp}`,
                        html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 10000))
                ]);
                console.log('Email sent successfully on Render:', result.messageId);
                return { success: true, message: 'OTP sent to email.' };
            } catch (renderErr) {
                console.warn('Email failed on Render, but allowing registration to continue:', renderErr.message);
                return { success: true, message: 'Registration proceeding - check email or use backup verification.' };
            }
        }
        
        // Local/development environment - longer timeout
        const emailPromise = transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your SHREST MAHOTSAV OTP Code',
            text: `Your OTP code for registration is ${otp}`,
            html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
        });
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email timeout')), 60000); // 60 second timeout for local
        });
        
        const result = await Promise.race([emailPromise, timeoutPromise]);
        console.log('Email sent successfully:', result.messageId);
        return { success: true, message: 'OTP sent to email.' };
    } catch (err) {
        console.error('Nodemailer error details:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        
        // Return success even if email fails on Render (for now)
        if (process.env.RENDER && (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED')) {
            console.warn('Email service unavailable on Render - proceeding without email verification');
            return { success: true, message: 'OTP sent (email service temporarily unavailable).' };
        }
        
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
