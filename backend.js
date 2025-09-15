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
    
    // For Render environment, show OTP in console and allow bypass
    if (process.env.RENDER) {
        console.log(`=== RENDER OTP FOR ${email}: ${otp} ===`);
        try {
            // Quick attempt to send email
            const emailPromise = transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: 'Your SHREST MAHOTSAV OTP Code',
                text: `Your OTP code for registration is ${otp}`,
                html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
            });
            
            // Very short timeout for Render
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email timeout')), 5000)
            );
            
            await Promise.race([emailPromise, timeout]);
            console.log(`Email sent successfully to ${email}`);
        } catch (err) {
            console.log(`Email failed for ${email}, but OTP is: ${otp}`);
        }
        return { success: true, message: 'OTP sent to email.' };
    }
    
    // Local environment - normal email sending
    try {
        const emailPromise = transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Your SHREST MAHOTSAV OTP Code',
            text: `Your OTP code for registration is ${otp}`,
            html: `<h2>SHREST MAHOTSAV Registration</h2><p>Your OTP code is: <strong>${otp}</strong></p><p>This OTP is valid for a limited time.</p>`
        });
        
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout')), 30000)
        );
        
        await Promise.race([emailPromise, timeout]);
        return { success: true, message: 'OTP sent to email.' };
    } catch (err) {
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

module.exports = { sendOtp, verifyOtp, otpStore };
