# SHREST MAHOTSAV Static Frontend

This project is deployed on Vercel as a static site. All API calls from the frontend go through a serverless proxy that forwards to the real backend.

- Configure `BACKEND_BASE_URL` in Vercel Project Settings → Environment Variables.
	Example: `https://your-backend-host.example.com`
- The catch-all function at `api/[...path].js` proxies any path to the backend, so calls like `/api/register`, `/api/upi-config`, etc. will be sent to `${BACKEND_BASE_URL}/api/register`, `${BACKEND_BASE_URL}/api/upi-config`, and so on.
- Static pages live in `public/` and include:
	- `public/shrestregistration.html`
	- `public/events.html`
	- `public/qrscanner.html`
	- `public/celebration.html`

Local development:
- To serve locally: `npx serve .` or `npx http-server .`
- The static pages expect API under `/api/...`. If you run the backend locally, set `BACKEND_BASE_URL` in a `.env` file and run via Vercel dev (`npx vercel dev`) to have the proxy in place.
