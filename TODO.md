# TODO: Disable OTP Verification and QR Email Sending

- [x] Edit api/register.js: Remove nodemailer email sending of QR code
- [x] Edit backend.js: Disable sendOtp and verifyOtp functions (make them no-ops)
- [x] Edit api/send-otp.js: Disable functionality, return success without action
- [x] Edit api/verify-otp.js: Disable functionality, return success without action
- [x] Edit api/get-otp.js: Disable functionality, return success without action
- [x] Edit public/shrestregistration.html: Remove/hide OTP UI elements and related JavaScript logic
