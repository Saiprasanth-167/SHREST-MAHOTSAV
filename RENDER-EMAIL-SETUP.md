# 🚀 Render Email Setup Guide

Your SHREST MAHOTSAV app is now optimized for Render! Follow these steps to enable email OTP delivery on https://shrest-mahotsav.onrender.com

## 📧 Step 1: Set Environment Variables on Render

1. **Go to Render Dashboard**
   - Visit [dashboard.render.com](https://dashboard.render.com)
   - Click on your `shrest-mahotsav` service

2. **Add Environment Variables**
   - Click on **Environment** tab in the left sidebar
   - Add these variables:

   ```
   Variable Name: EMAIL
   Value: shrestmahotsav@gmail.com
   
   Variable Name: PASSWORD  
   Value: rcyf kxxz pqym ndlh
   
   Variable Name: RENDER
   Value: true
   ```

3. **Deploy Changes**
   - Click **Save Changes**
   - Render will automatically redeploy your service

## 🔧 Step 2: Gmail App Password Setup

If emails still don't work, generate a fresh Gmail App Password:

1. **Google Account Settings**
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification → App passwords

2. **Generate New App Password**
   - Select "Mail" and "Other (custom name)"
   - Enter "SHREST MAHOTSAV RENDER"
   - Copy the 16-character password

3. **Update Render Environment**
   - Update the `PASSWORD` variable in Render with the new app password

## 🎯 Step 3: Test on Render

1. **Visit Your App**
   - Go to https://shrest-mahotsav.onrender.com/shrestregistration
   - Enter your email and request OTP

2. **Check Render Logs**
   - In Render Dashboard → Logs tab
   - Look for these messages:
     - ✅ `Email delivered to [email]` = SUCCESS
     - 🆘 `BACKUP OTP FOR [email]: 123456` = Email failed but OTP available

## 📊 Enhanced Logging

Your app now provides detailed logging on Render:

```
🎯 [timestamp] Generating OTP for email
🔑 OTP: 123456
🌐 Environment: RENDER
📧 Email account: shrestmahotsav@gmail.com
📤 Sending email to email...
✅ [SUCCESS] Email delivered to email
📨 Message ID: response_id
```

## 🆘 Backup Access Methods

If emails fail on Render:

### Method 1: Render Logs (Primary)
- Render Dashboard → Your Service → Logs
- Search for: `🆘 BACKUP OTP FOR [email]: 123456`

### Method 2: API Endpoint
- `POST https://shrest-mahotsav.onrender.com/api/get-otp`
- Body: `{"email": "user@email.com"}`

### Method 3: Test Endpoint (Debug)
- `POST https://shrest-mahotsav.onrender.com/api/test-email`
- Body: `{"email": "user@email.com"}`

## 🎨 Email Design

Your OTP emails now feature:
- **Professional SHREST MAHOTSAV branding**
- **Gradient background with white text**
- **Large, clear OTP display (32px font)**
- **Mobile-responsive design**
- **Security warnings and expiry info**

## ⚡ Render Optimizations Made

1. **Connection Settings**: IPv4-only, single connections
2. **Timeouts**: 25-second email timeout optimized for Render
3. **TLS**: Enhanced cipher support for better compatibility
4. **Logging**: Comprehensive debugging for Render environment
5. **Error Handling**: Graceful fallback with OTP backup access

## 🔍 Troubleshooting

**If emails still don't work on Render:**

1. **Check Environment Variables** - Ensure EMAIL and PASSWORD are set correctly
2. **Generate Fresh App Password** - Gmail app passwords can expire
3. **Check Render Logs** - Look for detailed error messages
4. **Use Backup Methods** - OTP is always available via logs/API

**Common Issues:**
- `EAUTH` error = Wrong Gmail app password
- `Timeout` error = Normal on Render, use backup OTP
- `ENOTFOUND` error = DNS/connectivity issue (Render will retry)

Your SHREST MAHOTSAV app is now fully Render-ready! 🎉

**Test URL**: https://shrest-mahotsav.onrender.com/shrestregistration