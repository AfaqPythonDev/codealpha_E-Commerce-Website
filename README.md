# 🛒 NovaCart — Premium E-Commerce Website

<div align="center">

![NovaCart Banner](client/images/hero-store.png)

**A fully functional, modern e-commerce platform built with Vanilla HTML/CSS/JS and a Node.js/Express REST API.**

[![GitHub repo](https://img.shields.io/badge/GitHub-AfaqPythonDev-181717?style=flat&logo=github)](https://github.com/AfaqPythonDev/codealpha_E-Commerce-Website)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)](#)

</div>

---

## ✨ Features

### 🛍️ Customer Side
- **Hero Section** — Cinematic luxury store background with animated "Discover More. Shop Smarter." headline
- **Product Catalog** — Filter by category, price, rating with instant search
- **Product Pages** — Image gallery, reviews, add to cart/wishlist
- **Shopping Cart** — Quantity controls, coupon codes, real-time price updates
- **Checkout Flow** — Address selection, payment method, order confirmation
- **Customer Dashboard**
  - My Profile (edit name, email, password)
  - Address Book (add/edit/delete shipping addresses)
  - My Payment Options
  - My Orders & Order Details
  - My Cancellations
  - My Reviews
  - My Wishlist

### 🛡️ Admin Panel
- Dashboard analytics (revenue, orders, customers, products)
- Product management (add/edit/delete with image URL support)
- Order management (update order status)
- Customer management
- Coupon management
- Category management

### 🎨 Design System
- **Warm White + Muted Sage/Olive Green** color palette
- Light & Dark mode toggle with smooth transitions
- Fully responsive (mobile, tablet, desktop)
- Premium glassmorphism effects
- Smooth scroll animations
- Ken Burns hero background animation

---

## 🗂️ Project Structure

```
E-Commerce-Website/
├── client/                      # Frontend (static files)
│   ├── index.html               # Home page
│   ├── shop.html                # Shop / Product listing
│   ├── product.html             # Product detail page
│   ├── cart.html                # Shopping cart
│   ├── checkout.html            # Checkout flow
│   ├── auth.html                # Login / Register
│   ├── dashboard.html           # Customer dashboard
│   ├── admin.html               # Admin panel
│   ├── css/
│   │   └── styles.css           # Full design system (3000+ lines)
│   ├── js/
│   │   ├── app.js               # Global app logic, auth state, navbar
│   │   ├── shop.js              # Product listing & filters
│   │   ├── product.js           # Product detail & reviews
│   │   ├── cart.js              # Cart management & coupons
│   │   ├── checkout.js          # Checkout flow
│   │   ├── dashboard.js         # Customer dashboard tabs
│   │   ├── auth.js              # Login / Register forms
│   │   └── admin.js             # Admin panel management
│   └── images/
│       └── hero-store.png       # Hero background image
│
├── server/                      # Backend (Node.js/Express)
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product CRUD
│   │   ├── orders.js            # Order management
│   │   ├── coupons.js           # Coupon system
│   │   └── analytics.js         # Admin analytics
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── data/                    # JSON-based data storage
│   └── dbHelper.js              # Data read/write helpers
│
├── server.js                    # Express entry point
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/AfaqPythonDev/codealpha_E-Commerce-Website.git
cd codealpha_E-Commerce-Website
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the server**
```bash
npm run dev
```

**4. Open in your browser**
```
http://localhost:3000
```

---

## 🔑 Default Admin Account

| Field    | Value             |
|----------|-------------------|
| Email    | `admin@novacart.com` |
| Password | `admin123`        |

> ⚠️ Change the admin password after your first login.

---

## 🧰 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| Backend    | Node.js, Express.js                 |
| Auth       | JWT (JSON Web Tokens), bcryptjs     |
| Database   | JSON file-based storage (dbHelper)  |
| Fonts      | Google Fonts — Outfit, Inter        |
| Icons      | Custom inline SVGs                  |
| HTTP       | CORS, Morgan (request logger)       |

---

## 📱 Pages Overview

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Hero, categories, deals, trending products |
| Shop | `/shop.html` | Filterable product catalog |
| Product | `/product.html?id=...` | Product detail with reviews |
| Cart | `/cart.html` | Cart with coupon support |
| Checkout | `/checkout.html` | Multi-step checkout |
| Login/Register | `/auth.html` | Authentication |
| Dashboard | `/dashboard.html` | Customer account management |
| Admin | `/admin.html` | Admin control panel |

---

## 🌗 Theme Support

The site supports **Light (Day) and Dark (Night)** modes:

| Mode  | Background | Accent |
|-------|-----------|--------|
| Light | Warm White `#faf9f7` | Sage `#7F9D7A` |
| Dark  | Deep Forest `#0d1210` | Sage `#A5BCA2` |

Toggle with the 🌙 moon / ☀️ sun icon in the navbar.

---

## 📸 Screenshots

### 🏠 Home Page
> Premium luxury hero with animated headline and trust strip

### 🛍️ Shop Page
> Filterable product catalog with category, price, and sort options

### 👤 Customer Dashboard
> Profile, orders, addresses, wishlist, reviews — all in one place

### 🛡️ Admin Panel
> Full product, order, customer, and coupon management

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Afaq Ahmad**
- GitHub: [@AfaqPythonDev](https://github.com/AfaqPythonDev)

---

<div align="center">
  <sub>Built with ❤️ using Node.js + Vanilla JS | CodeAlpha Internship Project</sub>
</div>
