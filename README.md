# SHREST MAHOTSAV

Local Node/Express app serving registration flow, OTP email, UPI QR, Excel export, and organiser tools.

## Prereqs
- Node.js 18+
- `.env` with `EMAIL`, `PASSWORD` (App Password), `UPI_VPA`, `UPI_NAME`

## Install & Run
```powershell
# from the project root
npm install
npm run start
# or live reload for development
npm run dev
```

App listens on `http://localhost:8000`.

## Key Endpoints
- `/` Home
- `/shrestregistration.html` Registration + UTR validation
- `/events.html` Event selection + final submission
- `/qrscanner.html` Organiser QR scanner
- `/live-excel` Organiser live Excel view
- `/api/upi-config`, `/api/upi-qr` UPI helpers
- `/api/send-otp`, `/api/verify-otp` Email OTP
- `/api/register` Final registration saving + QR email

## Data
- `registrations.json` stores submissions
- `shrestmahotsav-2k25.xls` stores a mirror with columns:
  Name, RegistrationNumber, Course, Branch, Section, Year, Campus,
  Email, UTR, Amount, Events, QRCodeFile, Timestamp
- QR images saved under `qrcodes/`

## Notes
- For Gmail, create an App Password and use it for `PASSWORD`.
- If `AmountPAID` existed in older sheets, startup migration converts to `Amount`.
