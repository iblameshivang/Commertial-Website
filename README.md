# 🛒 Shopverse — Our Full-Stack E-Commerce Project

Hey everyone! Welcome to **Shopverse**. 

We are a group of 18-year-old college students who decided to build a full-stack, responsive, and animated modern e-commerce web application from scratch. We wanted something that actually looks and feels like a real luxury online store — smooth transitions, real live cart sync, wishlist, dark aesthetic cards, filtering, and an admin management dashboard.

---

## 👥 The Team Behind This

Built with late nights, caffeine, and lots of debugging by:
* **Shivang Minhas**
* **Ankit**
* **Gaurav Maurya**
* **Digvijay Singh Rathore**

---

## 🤖 Our "Extended" AI Dev Team

We believe in using the best modern tools available to learn and ship faster. Massive shoutout to our AI co-pilots who helped us brainstorm architecture, debug weird edge cases, format code, and optimize tricky UI logic:
* **ChatGPT & Claude** (Architecture brainstorming, component logic, and troubleshooting backend routes)
* **Google Gemini** (Full-stack debugging, merge conflict resolutions, and Cloudflare tunnel setup)
* **GitHub Copilot & Antigravity** (Speeding up boilerplate, React hooks, and CSS token setups)

We designed the user flow, wired the whole system together, managed merge conflicts, resolved database schema mismatches, and made sure the site runs seamlessly across local servers and public mobile tunnels.

---

## ✨ What We Built

* **🎨 Atelier & Modern Storefront:** Clean minimalist layout with smooth card animations, responsive carousels, and quick preview modals.
* **🏷️ Dynamic Product Filtering:** Search by keyword, filter instantly by categories (Clothing, Electronics, Home, Beauty), sort by price/ratings, and filter dynamically by color swatches.
* **🛍️ Shared Cart & Wishlist System:** Seamless shopping bag drawer and wishlist integration that share real-time notification toasts.
* **⚡ Live Mobile Testing via Cloudflare:** Full proxy routing configuration allowing anyone on our team to open and interact with the live database and store directly from their phone browser.
* **📦 Complete Product Detail Pages:** Dynamic image galleries, color variant selectors, customer review feeds, and expandable care details.
* **🔐 Admin Portal & SQLite Engine:** Real database integration that stores products, handles order persistence, and saves user sessions.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Framer Motion (for smooth micro-interactions), Lucide Icons, Vanilla CSS Design Tokens
* **Backend:** Node.js, Express.js
* **Database:** SQLite (using local persistent storage)
* **Tunneling & Deployment Testing:** Cloudflared (Quick Tunnels)

---

## 🚀 How to Run It Locally

If you want to clone this repo and run it on your own machine:

### 1. Start the Backend
```bash
cd server
npm install
npm start
