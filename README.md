# Chef’s Planet (चीफ्स प्लैनेट) — Official Website

> **Authentic North Indian Flavours in the Heart of Solan**  
> Inspired by the cinematic, video-driven luxury aesthetic of *Just Falafel / jfvegancafe.com*.

---

## 🌟 Highlights

- 🎬 **Cinematic Video Hero:** Autoplaying multi-scene video background with smooth crossfades, mute/unmute audio control, and spinning circular "VIEW FULL MENU" button.
- 🍛 **Authentic North Indian Cuisine:** Highlighted signature dishes (Dal Makhani, Butter Chicken, Paneer Tikka Sizzler, Dum Biryani) with realistic ₹ prices, veg/non-veg indicators, spice levels, and recipe modal inspection.
- 🛒 **Interactive Ordering & WhatsApp Cart:** Slide-over cart drawer with delivery / dine-in / takeaway selector and 1-click WhatsApp order generator formatted for `01792 220 224`.
- 📅 **Table Reservation System:** Interactive booking modal with guest counts, time slots, seating area choices, and golden confetti confirmation.
- 📍 **Solan Location & Google Maps:** Embedded interactive map centered at Rajgarh Rd, Solan, HP 173212 (Located in Smart Homes, Plus Code: `W442+WP`).
- ⭐ **Google Reviews Showcase:** 4.0 ★ rating with 1,287+ verified reviews.
- 📱 **Mobile-First Responsive:** Sticky bottom quick-action bar for mobile users.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
├── public/
│   └── favicon.svg             # Gold emblem favicon
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Transparent-to-frosted glass navigation
│   │   ├── Hero.jsx            # Multi-scene video hero & spinning circular CTA
│   │   ├── AboutSection.jsx    # Heritage story & Solan mountain highlights
│   │   ├── SignatureDishes.jsx # Spotlight dishes with hover effects & recipe popup
│   │   ├── ServicesBanner.jsx  # Dine-in, Drive-through, No-contact delivery
│   │   ├── MenuSection.jsx     # Categorized full menu with live search & filters
│   │   ├── CartDrawer.jsx      # Slide-over cart & WhatsApp order generator
│   │   ├── ReservationModal.jsx# Table booking modal with celebration confetti
│   │   ├── DishDetailModal.jsx # Detailed recipe inspection popup
│   │   ├── ReviewsSection.jsx  # 4.0 ★ rating with 1,287 Google reviews
│   │   ├── LocationSection.jsx # Embedded Google Map & Solan coordinates
│   │   ├── MobileStickyBar.jsx # Bottom quick action bar for mobile screens
│   │   └── Footer.jsx          # Dark luxury footer with Devanagari marks
│   ├── data/
│   │   ├── restaurantInfo.js   # Official restaurant metadata, phone, location
│   │   ├── menuData.js         # Categorized dishes with ₹ prices & descriptions
│   │   ├── videoHeroData.js    # Video scenes & fallback photography
│   │   └── reviewsData.js      # Verified customer testimonials
│   ├── App.jsx                 # Application root with cart state & modals
│   ├── main.jsx
│   └── index.css               # Design system tokens, glassmorphism & keyframes
├── tailwind.config.js
└── package.json
```

---

## 📍 Restaurant Details

- **Name:** Chef’s Planet (चीफ्स प्लैनेट)
- **Address:** Rajgarh Rd, Solan, Himachal Pradesh 173212
- **Landmark:** Located in Smart Homes
- **Phone:** 01792 220 224
- **Plus Code:** W442+WP Solan, Himachal Pradesh
- **Hours:** Open Daily 10:00 AM – 11:00 PM
- **Price Range:** ₹200 – ₹1,200 per person
- **Rating:** 4.0 ★ (1,287 Google Reviews)
