# 🛒 ScanoShop — Smart In-Store Checkout Platform

> A production-ready full-stack smart shopping system featuring barcode scanning simulation, real-time cart management, MySQL transaction-backed checkout, JWT authentication, and an admin analytics dashboard.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **Auth** | JWT login/register, bcrypt password hashing, role-based access (USER / ADMIN) |
| 📦 **Products** | Full CRUD (admin), search, category filter, pagination |
| 📷 **Scan** | Barcode scan simulation → auto-adds to cart |
| 🛒 **Cart** | Per-user persistent cart in MySQL, real-time totals |
| 💳 **Checkout** | MySQL `$transaction` with stock validation, rollback on failure |
| 📋 **Orders** | Order history with expandable item details |
| 📊 **Admin** | Stats dashboard, Recharts pie/bar charts, low-stock alerts, order management |

---

## 🏗️ Tech Stack

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Axios · Recharts · Lucide Icons

**Backend:** Node.js · Express · Prisma ORM · MySQL · JWT · bcryptjs · express-validator

---

## 📁 Project Structure

```
ScanoShop/
├── backend/
│   ├── config/          # Prisma client singleton
│   ├── controllers/     # auth, product, cart, scan, order, admin
│   ├── middleware/       # JWT auth, role guard, input validation
│   ├── prisma/          # schema.prisma + seed.js
│   ├── routes/          # Express routers
│   ├── utils/           # Response helpers
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/  # Navbar, ProductCard, ProtectedRoute, LoadingSpinner
│       ├── context/     # AuthContext, CartContext
│       ├── pages/       # Login, Register, Products, Scan, Cart, Orders, AdminDashboard
│       └── services/    # Axios API wrappers
├── schema.sql           # Raw MySQL schema (reference)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally
- npm

### 1. Clone & Install

```bash
git clone https://github.com/karthikeyan2535/ScanoShop-Smart-In-Store-Checkout-Platform.git
cd ScanoShop-Smart-In-Store-Checkout-Platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/smart_shopping"
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Push DB schema & seed data:
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

### 4. Open App

Visit **http://localhost:5173**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shop.com | admin123 |
| User | user@shop.com | user123 |

---

## 🔌 API Reference

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login & get JWT |
| GET | `/auth/me` | Get current user |

### Products
| Method | Route | Auth | Role |
|--------|-------|------|------|
| GET | `/products` | ✅ | ANY |
| GET | `/products/:id` | ✅ | ANY |
| GET | `/products/categories` | ✅ | ANY |
| POST | `/products` | ✅ | ADMIN |
| PUT | `/products/:id` | ✅ | ADMIN |
| DELETE | `/products/:id` | ✅ | ADMIN |

### Cart
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/cart` | Get user cart |
| POST | `/cart/add` | Add item |
| PUT | `/cart/update` | Update quantity |
| DELETE | `/cart/remove/:id` | Remove item |
| DELETE | `/cart/clear` | Clear cart |

### Scan
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/scan` | Scan barcode → add to cart |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/order/checkout` | Place order (transaction) |
| GET | `/order/user` | User's orders |
| GET | `/order/:id` | Single order |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/stats` | Dashboard stats |
| GET | `/admin/orders` | All orders (filterable) |
| GET | `/admin/low-stock` | Low stock products |

---

## 🧠 Architecture Highlights

### MySQL Transaction (Checkout)
```
BEGIN TRANSACTION
  ├── Validate cart is not empty
  ├── Check stock for every item
  ├── Create order (PENDING)
  ├── Create order_items
  ├── Deduct stock atomically (decrement)
  ├── Update order status → COMPLETED
  └── Clear cart items
COMMIT — or ROLLBACK on any failure
```

### Database Design
- Normalized schema with foreign keys & indexes
- `cart_items` has unique constraint on `(cartId, productId)` — no duplicates
- `products.barcode` indexed for O(1) scan lookup

### Security
- JWT stored in Authorization header (Bearer)
- bcrypt with 12 salt rounds
- Role middleware (`authorize('ADMIN')`) on all admin routes
- Input validation via `express-validator` on all mutation endpoints
- Users can only access their own cart and orders

---

## 🌐 Deployment

| Service | Platform |
|---------|---------|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway |
| Database | Railway MySQL / PlanetScale / AWS RDS |

Set environment variables on each platform as described in the setup section above.

---

## 📊 Sample Postman Request

```json
POST /auth/login
{
  "email": "user@shop.com",
  "password": "user123"
}

POST /scan
Authorization: Bearer <token>
{
  "barcode": "PHONE-001"
}

POST /order/checkout
Authorization: Bearer <token>
{}
```

---

## 📄 License

MIT © 2024 ScanoShop
