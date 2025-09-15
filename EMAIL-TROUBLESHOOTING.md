## 🔍 Email Troubleshooting Guide

Your OTP emails aren't being delivered. Here are the most common causes and solutions:

### 1. **Gmail App Password Issues** (Most Common)

**Problem**: Your Gmail app password might be:
- Expired
- Incorrect
- Revoked
- Not properly configured

**Solution**: 
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Update your `.env` file or Render environment variables

### 2. **Gmail Account Settings**

**Check these settings**:
- 2-Factor Authentication is enabled
- "Less secure app access" is disabled (should be disabled)
- App passwords are enabled

### 3. **Current Configuration Check**

Your current email setup:
```
Email: shrestmahotsav@gmail.com
Password: rcyf kxxz pqym ndlh (16-character app password)
Service: Gmail
Port: 465 (SSL)
```

### 4. **Quick Test Methods**

#### Test A: Use the test endpoint
```bash
POST http://localhost:3000/api/test-email
Body: {"email": "your-email@gmail.com"}
```

#### Test B: Check server logs
Look for these messages:
- ✅ "Email server is ready to send messages" = Configuration OK
- ❌ "Email configuration failed" = Authentication problem

### 5. **Common Error Messages**

- **"Invalid login"** → App password is wrong
- **"Authentication failed"** → 2FA or app password issue
- **"Timeout"** → Network/firewall issue
- **"EAUTH"** → Gmail authentication problem

### 6. **Alternative Solutions**

If Gmail continues to fail:

#### Option A: Use a different email service
```javascript
// In backend.js, replace Gmail with:
service: 'outlook', // or 'yahoo', 'hotmail'
```

#### Option B: Use SMTP directly
```javascript
host: 'smtp.gmail.com',
port: 587,
secure: false, // Use STARTTLS
```

### 7. **Immediate Action Items**

1. **Generate new Gmail app password**
2. **Test with test-email endpoint**
3. **Check server console for detailed error messages**
4. **Verify Gmail account security settings**

### 8. **Environment Variables**

Make sure these are set correctly:
```
EMAIL=shrestmahotsav@gmail.com
PASSWORD=your-new-app-password
```

Would you like me to help you generate a new Gmail app password or try a different email service?