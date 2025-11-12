# Device Dashboard

Simple React + Vite dashboard that connects to your existing backend at http://localhost:5000 and lists saved device records from Firestore.

How to run:

1. cd dashboard
2. npm install
3. npm run dev

The dev server proxies `/api` to http://localhost:5000 so the dashboard can call your existing endpoints.

Notes:
- The dashboard is minimal; you can extend it to show full payload, filters, sorting, and export.
- For production you can `npm run build` and serve `dist/` from any static host or integrate into your main server.
