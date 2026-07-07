# ScanoShop – Smart In-Store Checkout Platform

## Description
ScanoShop is an end-to-end checkout platform. Shoppers can scan product barcodes in-store, manage their cart, and pay seamlessly via Razorpay. Real-time updates ensure admin users always have an accurate view of stock levels and store revenue.

## Features Added
- **Inventory Reservation:** Items are reserved for 30 minutes when added to the cart, automatically releasing via CRON jobs.
- **Razorpay Integration:** Full payment flow with signature verification.
- **HTML5 QR Code Scanner:** Instant, client-side camera scanning of barcodes with cool-down logic.
- **Redis Caching:** Faster product queries and catalog loading.
- **Socket.io WebSockets:** Real-time dashboard and inventory synchronization.
- **Docker Compose Setup:** One command to start the entire stack.

## Tech Stack
- Frontend: React, Vite, TailwindCSS
- Backend: Node.js, Express
- DB / Caching: MySQL, Prisma ORM, Redis
- Realtime: Socket.io
- Payments: Razorpay

## Quick Start (Docker)
Ensure you have Docker installed.

```bash
docker-compose up --build -d
```
Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Quick Start (Local Manual)

1. **Start Services** (MySQL & Redis required).
2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   npx prisma db push --accept-data-loss
   npx prisma generate
   npm run db:seed
   npm start
   ```
3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running Tests
Tests use `jest` and `supertest`.
```bash
cd backend
npm test
```
