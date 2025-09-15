const otpStore = {};

console.log(' SHREST MAHOTSAV OTP System Initialized');
console.log(' Email-free OTP generation enabled');

async function sendOtp(email) {
    // Disabled: OTP verification is no longer required
    return {
        success: true,
        message: 'OTP verification disabled.'
    };
}

function verifyOtp(email, otp) {
    // Disabled: OTP verification is no longer required
    return { success: true };
}

// Function to get current OTP for debugging
function getCurrentOtp(email) {
    return otpStore[email] || null;
}

module.exports = { sendOtp, verifyOtp, otpStore, getCurrentOtp };
