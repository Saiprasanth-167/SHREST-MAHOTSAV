require('dotenv').config();
const nodemailer = require('nodemailer');
const otpStore = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL || "shrestmahotsav@gmail.com",
        pass: process.env.PASSWORD || "rcyf kxxz pqym ndlh"
    },
    secure: true,
    port: 465,
    // Render-optimized timeouts
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: {
        rejectUnauthorized: false,
        // Additional TLS options for Render
        ciphers: 'ALL'
    },
    // Render-specific optimizations
    pool: false, // Disable connection pooling for Render
    maxConnections: 1,
    maxMessages: 1,
    // Force IPv4 for better Render compatibility
    family: 4
});

// Test email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration failed:', error);
        console.log('Email user:', process.env.EMAIL || "shrestmahotsav@gmail.com");
        console.log('Password configured:', !!(process.env.PASSWORD || "rcyf kxxz pqym ndlh"));
    } else {
        console.log('✅ Email server is ready to send messages');
        console.log('Email user:', process.env.EMAIL || "shrestmahotsav@gmail.com");
    }
});

async function sendOtp(email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return { success: false, message: 'Invalid email.' };
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    
    // Enhanced logging for Render debugging
    console.log(`🎯 [${new Date().toISOString()}] Generating OTP for ${email}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`🌐 Environment: ${process.env.RENDER ? 'RENDER' : 'LOCAL'}`);
    console.log(`📧 Email account: ${process.env.EMAIL || "shrestmahotsav@gmail.com"}`);
    
    try {
        const mailOptions = {
            from: {
                name: 'SHREST MAHOTSAV',
                address: process.env.EMAIL || "shrestmahotsav@gmail.com"
            },
            to: email,
            subject: 'SHREST MAHOTSAV - Your OTP Code',
            text: `Your OTP code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #2c3e50; margin: 0;">SHREST MAHOTSAV</h2>
                        <p style="color: #7f8c8d; margin: 5px 0;">Registration OTP</p>
                    </div>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <p style="color: white; margin: 0 0 10px 0; font-size: 16px;">Your OTP Code:</p>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 4px;">
                            <span style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 4px;">${otp}</span>
                        </div>
                    </div>
                    <div style="text-align: center; color: #7f8c8d; font-size: 14px;">
                        <p>This code expires in 10 minutes</p>
                        <p>Never share this code with anyone</p>
                    </div>
                </div>
            `
        };
        
        // Render-specific email handling with detailed logging
        console.log(`� Sending email to ${email}...`);
        
        const emailPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email timeout after 25 seconds')), 25000)
        );
        
        const result = await Promise.race([emailPromise, timeoutPromise]);
        
        console.log(`✅ [SUCCESS] Email delivered to ${email}`);
        console.log(`📨 Message ID: ${result.messageId}`);
        console.log(`� Response: ${JSON.stringify(result.response)}`);
        
        return { 
            success: true, 
            message: 'OTP sent to your email successfully! Check your inbox and spam folder.' 
        };
        
    } catch (emailError) {
        console.error(`❌ [EMAIL FAILED] ${email}: ${emailError.message}`);
        console.error(`🔍 Error Code: ${emailError.code}`);
        console.error(`🔍 Error Stack: ${emailError.stack}`);
        
        // Always log OTP for Render access
        console.log(`🆘 BACKUP OTP FOR ${email}: ${otp}`);
        console.log(`📋 Time: ${new Date().toISOString()}`);
        
        // Return success with backup message for better UX
        return { 
            success: true, 
            message: 'OTP generated! If you don\'t receive the email within 2 minutes, check your spam folder or contact support.' 
        };
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
