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

## Deploying

You can deploy the static site to Vercel and run the Node backend separately. The repo includes a serverless proxy so the frontend can talk to whatever backend URL you configure.

1) Deploy the backend (server.js)
- Use any Node host (Render, Railway, Fly.io, or a VPS). Ensure persistent disk if you need to keep `registrations.json`, Excel file, and `qrcodes/` across restarts.
- Set env vars: `EMAIL`, `PASSWORD`, `UPI_VPA`, `UPI_NAME`, optionally `PORT`.
- Verify it serves endpoints like `GET /api/health`, `POST /api/register`, `GET /live-excel`, `GET /download-excel`.

2) Deploy to Vercel (frontend + proxy)
- The `vercel.json` routes `/api/*`, `/live-excel`, and `/download-excel` through `api/proxy/[...path].js`.
- In Vercel Project Settings → Environment Variables, add `BACKEND_URL` pointing to your backend base URL, e.g. `https://your-backend.onrender.com`.
- Example mapping:
  - `/api/send-otp` → proxies to `${BACKEND_URL}/api/send-otp`
  - `/live-excel` → proxies to `${BACKEND_URL}/live-excel`
  - `/download-excel` → proxies to `${BACKEND_URL}/download-excel`

3) Local testing of proxy (optional)
- You can simulate the proxy behavior locally by setting `BACKEND_URL` and using `vercel dev`, or deploy and test live: open your Vercel URL and hit `/api/health`.

4) Security/operational notes
- The proxy forwards method, headers, query, and body verbatim. Ensure CORS and auth controls are enforced on the backend as needed.
- For file downloads (`/download-excel`) and HTML (`/live-excel`), proxy streams the response back to the browser.
