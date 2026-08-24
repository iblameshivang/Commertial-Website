# 🛒 Shopverse — Our E-Commerce Web App

Hey there! Welcome to **Shopverse**. 

We are a group of four 18-year-old college friends who wanted to build a clean, modern, and fully working luxury e-commerce store from scratch. We wanted smooth animations, real product filters, working carts, and a live database instead of just static mockups.

---

## 👥 The Team

Built by:
* **Shivang Manhas**
* **Ankit**
* **Gaurav Maurya**
* **Digvijay Singh Rathore**

---

## 🤖 Our AI Tools

We built this ourselves, but we used modern AI tools to help us brainstorm, write boilerplate, and squash tricky bugs along the way:
* **ChatGPT & Claude** (Component logic and backend routing)
* **Google Gemini** (Full-stack debugging, merge conflicts, and Cloudflare setup)
* **GitHub Copilot & Antigravity** (Speeding up frontend code and styling tokens)

---

## ✨ Features

* **Minimalist Storefront:** Smooth product cards, image sliders, and hover effects.
* **Instant Filtering:** Real-time search, category filters (Clothing, Electronics, Home, Beauty), and color pickers.
* **Bag & Wishlist:** Real-time cart drawer and wishlist notifications.
* **Product Details:** Dedicated detail pages with variant selectors and reviews.
* **Live Sharing:** Configured to run live on our phones via Cloudflare tunnels.

---

## 🛠️ Built With

* **Frontend:** React, Vite, Framer Motion, Lucide Icons, CSS
* **Backend:** Node.js, Express.js
* **Database:** SQLite (local persistent database)

---

## 🚀 How to Run It

Run these in separate terminal tabs:

```bash
# Terminal 1: Backend Server (Port 5001)
cd server
npm install
npm start

# Terminal 2: Frontend Client (Port 5173)
cd client
npm install
npm run dev

# Terminal 3: Live Cloudflare Tunnel (Optional - to test on phone)
cloudflared tunnel --url http://localhost:5173
