# Shopverse — Project Specification & Change Log

## Phase 1 — Step 1: Design Tokens & Google Fonts Integration
**Type:** Style  
**Files Modified:**
- `/client/index.html` — Integrated Google Fonts (Playfair Display and Inter)
- `/client/src/styles/tokens/colors.css` — Defined 9 immutable ShopVerse palette colors, gradients, and functional variables
- `/client/src/styles/tokens/animations.css` — Defined easing curves, durations, and keyframe animations

**API Changes:**
- None

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: sapphire (#72B0AB), arctic (#BCDDDC), lace (#FFEDD1), bubblegum (#FDC1B4), ballet-slipper (#FE9179), sage (#CFB97E), pistachio (#B89D47), spruce (#355E58), peacock (#053229)
- Typography: Display (64px), H1 (48px), H2 (32px), H3 (24px), Body (16px), Caption (12px), Price (20px)
- Animations: --duration-instant (100ms), --duration-fast (200ms), --duration-base (300ms), --duration-slow (500ms), --duration-hero (800ms); cubic-bezier easings

**Dependencies Added:**
- None

**Notes:**
- Established strict zero-emoji styling system across all token references.

---

## Phase 1 — Step 2: Navbar Redesign & Frosted Glass Layout
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/components/Navbar.jsx` — 72px sticky navbar with serif brand logo, centered 400px search with debounced autocomplete dropdown, and spruce icon cluster
- `/client/src/components/Navbar.css` — Frosted glass effect, slide-in underlines on hover, bubblegum bounce badge

**API Changes:**
- `GET /api/products/search?q={term}&limit=8` — Autocomplete search integration

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: peacock, spruce, lace, arctic, sapphire, bubblegum
- Typography: Playfair Display (24px logo), Inter (14px links, 14px search input, 10px badge)
- Animations: slide-in underline (300ms cubic-bezier(0.4, 0, 0.2, 1)), cart badge bounce (400ms cubic-bezier(0.34, 1.56, 0.64, 1))

**Dependencies Added:**
- None

**Notes:**
- Mobile responsive layout transitions search bar and navigation links into streamlined overlay drawers without layout shift.

---

## Phase 2 — Step 3: Database Schema Expansion & Backend Authentication
**Type:** Feature  
**Files Modified:**
- `/server/package.json` — Added bcryptjs and jsonwebtoken dependencies
- `/server/db.js` — Expanded SQLite schema to include users, promo_codes, sales, advertisements, products with seller_id & discount_percentage, carts with promo_code_id
- `/server/index.js` — Implemented JWT authentication, seller isolation, best-sellers calculation, promo code validation, and standardized JSON contracts

**API Changes:**
- `POST /api/auth/register` — Customer & seller registration with brand_name
- `POST /api/auth/login` — Authentication returning signed JWT
- `GET /api/auth/me` — Current user profile with role
- `GET /api/products/best-sellers` — Calculates top selling products in last 30 days
- `GET /api/products/new-launches` — Latest 10 active products
- `POST /api/cart/apply-promo` — Validates promo codes against minimum order threshold and expiry
- `GET /api/seller/products` — Restricted to current authenticated seller
- `POST /api/seller/products` — Bulk product creation
- `POST /api/seller/promo-codes` — Custom seller promo code creation

**Database Changes:**
- Created `users`, `promo_codes`, `sales`, `advertisements`, `carts`, `wishlists`, `reviews`, `recently_viewed` tables
- Added `seller_id`, `video_url`, `discount_percentage` to `products`

**Design Tokens Used:**
- Standardized API payload `{ success, data, message, meta }`

**Dependencies Added:**
- `bcryptjs@^3.0.3`, `jsonwebtoken@^9.0.3`

**Notes:**
- Seeded default users (`admin`, `urban_seller`, `tech_seller`, `lumi_seller`), 21 high-definition products with 30-day sales volume, and verified promo codes (`WELCOME10`, `SUMMER20`, `FLAT500`).

---

## Phase 3 — Step 4: Immersive Hero Carousel & Editorial Home Sections
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/components/Home/HeroCarousel.jsx` — 100vh parallax Hero Carousel with Ken Burns zoom, 10s auto-rotation, and staggered typography entrance
- `/client/src/components/Home/HeroCarousel.css` — Custom display styling and responsive viewports
- `/client/src/components/Home/ProductCard.jsx` — 3:4 aspect ratio cards with top-right hover actions and checkmark animation
- `/client/src/components/Home/ProductCard.css` — Editorial card typography and hover scale
- `/client/src/components/Home/ProductScroller.jsx` — Reusable horizontal smooth scroller
- `/client/src/components/Product/QuickViewModal.jsx` — Quick View modal with backdrop blur, swatches, and size picker
- `/client/src/pages/HomePage.jsx` — 4 curated sections ("Curated For You", "Trending Now", "Fresh Arrivals", "Shop by Category") and manifesto banner
- `/client/src/pages/HomePage.css` — 120px section whitespace and 4:5 category card styling

**API Changes:**
- `GET /api/advertisements` — Fetches active ads and auto-generated best-sellers
- `GET /api/products?category={cat}&limit=4` — Dynamic curated section loading

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: peacock, spruce, lace, arctic, sapphire, sage, bubblegum, ballet-slipper
- Typography: Display (64px Playfair Display), H2 (36px/32px), Caption (12px uppercase), Body (16px/18px)
- Animations: Staggered fadeUp (800ms cubic-bezier(0.22, 1, 0.36, 1)), Ken Burns slow (20s), Modal scaleUp (250ms)

**Dependencies Added:**
- None

**Notes:**
- Zero emojis across all headings, cards, badges, and interactive controls.

---

## Phase 4 — Step 5: Shop Page, Search Autocomplete & Multi-Facet Filters
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/pages/ShopPage.jsx` — Dynamic search bar, collapsible 280px sidebar, URL parameter sync, active filter chips, and 3:4 aspect grid
- `/client/src/pages/ShopPage.css` — 32px grid layout, custom 18px checkbox, toggle slider, color swatches, and segmented gender buttons

**API Changes:**
- `GET /api/products?category&brand&minPrice&maxPrice&inStock&colors&materials&gender&style&sortBy&page&limit` — Multi-facet product filtering
- `GET /api/filters/:category` — Dynamic metadata aggregations

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: peacock, spruce, lace, arctic, sapphire, ballet-slipper, bubblegum
- Typography: H1 (48px/32px), H3 (20px), Body (14px), Caption (12px uppercase)
- Animations: Collapse transition (400ms cubic-bezier(0.4, 0, 0.2, 1)), Shimmer lace (1.5s)

**Dependencies Added:**
- None

**Notes:**
- Instant filter application with zero lag and shareable URL state synchronization.

---

## Phase 5 — Step 6: Admin Portal, Seller Isolation & Liquid Organic Transition
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/AdminDashboard.jsx` — Merchant portal with 240px dark peacock sidebar, bulk uploader, promo editor, and discount markdown manager
- `/client/src/AdminDashboard.css` — Lace content background, widgets, and tabular layout
- `/client/src/components/Admin/LoginScreen.jsx` — Dual login/seller registration view with fluid liquid organic transition animation
- `/client/src/components/Admin/LoginScreen.css` — SVG morphing keyframes and responsive card styling
- `/client/src/App.jsx` — Integrated auth state checking, logout handling, and editorial footer

**API Changes:**
- `GET /api/seller/products` — Returns products isolated strictly to authenticated seller
- `POST /api/seller/products` — Batch insertion of multiple catalogue products
- `PUT /api/seller/products/:id/discount` — Dynamic markdown manager
- `POST /api/seller/promo-codes` — Custom seller coupon generation

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: peacock, spruce, lace, arctic, sapphire, sage, bubblegum
- Typography: Display (32px Playfair Display), H2 (22px), Body (14px), Caption (12px uppercase)
- Animations: liquidWave (1.2s cubic-bezier(0.4, 0, 0.2, 1))

**Dependencies Added:**
- None

**Notes:**
- Sellers only manage their own products, sales analytics, and promo codes.

---

## Phase 6 — Step 7: Complete User & Product Experience (Promo Codes, Reviews, Watchlist)
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/CartContext.jsx` — Integrated live promo code validation (`applyPromoCode`, `removePromoCode`) and discount calculations
- `/client/src/CartDrawer.jsx` — Promo voucher input, discount line items, and zero emojis
- `/client/src/PriceDetails.jsx` — Order summary breakdown with applied voucher tags
- `/client/src/ProductDetailPage.jsx` — Playfair Display typography, sage review stars, swatches, specs tabs, and recently viewed scroller
- `/client/src/ProductDetailPage.css` — Luxury detail page styling and responsive gallery
- `/client/src/WishlistPage.jsx` — Curated watchlist grid with move to shopping bag actions
- `/client/src/WishlistPage.css` — Watchlist luxury styling
- `/client/src/CheckoutPage.jsx` — Order placement passing applied voucher codes
- `/client/src/OrderConfirmationPage.jsx` — Atelier confirmation receipt with Lucide phone/mail icons and zero emojis

**API Changes:**
- `POST /api/reviews` — Verified client review submission with star rating
- `GET /api/reviews/:productId` — Review list loading
- `POST /api/recently-viewed` — Session tracking for explored products
- `GET /api/recently-viewed` — Recent exploration history

**Database Changes:**
- None

**Design Tokens Used:**
- Colors: peacock, spruce, lace, arctic, sapphire, sage, ballet-slipper
- Typography: Display (44px Playfair Display), H2 (28px), Body (15px), Caption (12px uppercase)
- Animations: fadeUp, modalScaleUp, checkmark toast

**Dependencies Added:**
- None

**Notes:**
- Strict Zero-Emoji policy verified across all views.

---

## Phase 7 — Step 8: Luxury Color Names & AI Palette Assistant Engine
**Type:** Feature & Style  
**Files Modified:**
- `/client/src/utils/colors.js` — Created luxury Color System, RGB-to-Name nearest color matcher, and AI Color Suggester Engine
- `/server/colors.js` — Server-side AI color extraction assistant module
- `/server/index.js` — Added `POST /api/ai/suggest-colors` endpoint, `PUT /api/seller/products/:id/colors`, and `/api/products/:id/variants`
- `/server/db.js` — Added `product_color_variants` table, seeded high-definition variants, and updated schema migrations
- `/client/src/ProductDetailPage.jsx` — Removed raw hex code display (`Color Palette: #355E58` -> `Color: Deep Spruce`), connected variant image switching on swatch click, and sanitized shopping bag color names
- `/client/src/components/Product/QuickViewModal.jsx` — Cleaned up color labels to use human-readable luxury names with tooltips
- `/client/src/pages/ShopPage.jsx` — Formatted filter swatch tooltips and active chip labels with human color names
- `/client/src/AdminDashboard.jsx` — Integrated Atelier Color Management modal, 20-swatch clickable preset grid, custom color picker, and 1-click **"Auto-Detect with AI"** palette generator
- `/client/src/AdminDashboard.css` — Styled AI assistant box, preset swatch grid, active color chips, and swatch table indicators
- `/client/src/CartItemRow.jsx` — Formatted cart item color tags to display clean luxury names

**API Changes:**
- `POST /api/ai/suggest-colors` — Analyzes product title, description, category, and image URL to predict optimal luxury color palettes
- `PUT /api/seller/products/:id/colors` — Updates assigned product colors
- `POST /api/seller/products/:id/variants` — Creates and updates multi-color image variants
- `GET /api/products/:id/variants` — Fetches specific product variants

**Database Changes:**
- Created `product_color_variants` table with indexes
- Added `default_image`, `updated_at` to `products`
- Added `color_variant_id` to `carts`

**Design Tokens Used:**
- Colors: Deep Spruce, Midnight Peacock, Alpine Teal, Frosted Arctic, Warm Ivory, Blush Peach, Desert Terracotta, Antique Sage, Obsidian Black, Pure Chalk, Cognac Leather, Smoked Walnut, Brushed Gold
- Typography: Display, Caption (11px uppercase), Body (14px)
- Animations: AI pulse shimmer, swatch active scale

**Dependencies Added:**
- None

**Notes:**
- Raw hex codes (e.g. `#355E58`) are completely removed from all customer-facing views and replaced with human-readable luxury color names with circular swatches.

---

## Phase 8 — Step 9: Architecture Refinement, PDP 3-Column Luxury Layout, Dual Hover, Cart Logic & Samsung Showcase
**Type:** Feature & Bug Fix  
**Files Modified:**
- `/server/db.js` — Resolved SQLite migration issue by removing non-constant `DEFAULT CURRENT_TIMESTAMP` from `ALTER TABLE ADD COLUMN`; verified 71 seeded multi-color variants.
- `/server/index.js` — Added `/api/filters/colors` endpoint returning distinct available color names and hex values.
- `/client/src/AdminDashboard.jsx` — Multi-Photo Color Assignment modal with 80px thumbnail preview, color picker, image URL input, stock assignment; bulk upload row deletion with 300ms smooth height collapse transition and 1-row minimum validation.
- `/client/src/AdminDashboard.css` — Styled variant manager rows, 80px thumbnail boxes, remove buttons, and row collapse keyframes.
- `/client/src/components/Home/ProductCard.jsx` — Added dual-image hover overlay, 4-second auto-cycle slide, 20px color swatches with active `#72B0AB` ring and 150ms image crossfade, out-of-stock disabled/grayscale swatch with `#FE9179` tooltip, and Add-to-Cart toggle button logic (1st click adds with Pistachio `#B89D47` checkmark, 2nd click removes with Ballet Slipper `#FE9179` minus).
- `/client/src/components/Home/ProductCard.css` — Added dual-image transition layers, swatch tooltip styles, and feedback button states.
- `/client/src/ProductDetailPage.jsx` — Implemented luxury 3-column architecture (`80px 1fr 400px` on desktop) with vertical thumbnail strip (left), high-resolution center showcase with full-screen Lightbox Zoom modal, 32px color swatches with crossfade, architectural size selector, quantity stepper, full-width CTA, 3 collapsible accordions (Fabric & Atelier Care, Shipping & Returns, Fit Guide), and sticky bottom mobile Add to Bag bar.
- `/client/src/ProductDetailPage.css` — 3-column grid rules, vertical thumbnail strip styling, zoom modal backdrop filter, accordions, and mobile sticky bar.
- `/client/src/components/Navbar.jsx` & `/client/src/components/Navbar.css` — Search input morphing expand on focus (`max-width: 240px` to `420px`) with `#FFEDD1` background, collapse on blur, and Escape key listener to clear/close.
- `/client/src/pages/ShopPage.jsx` & `/client/src/pages/ShopPage.css` — Removed duplicate search section, connected dynamic `/api/filters/colors`, and aligned filter sidebar flush with product grid (`top: 88px`, `rgba(255, 237, 209, 0.45)` backdrop blur, 11px uppercase headers).
- `/client/src/CartDrawer.jsx` & `/client/src/styles.css` — Polished promo code container: white box, 48px input with embedded right-aligned `#355E58` Apply button, green tag applied discount state, and 300ms shake error animation (`inputShake`).
- `/client/src/components/Home/ShowcaseSection.jsx` & `ShowcaseSection.css` — Samsung-style full-width showcase section (`1fr 1fr`) with floating 520px product visual, subtle float physics (`floatSlow 6s ease-in-out`), and angle switcher.
- `/client/src/components/Home/CollageGrid.jsx` & `CollageGrid.css` — 5-card liquid reveal collage grid (`1 large 2x2 card`, `4 smaller cards`) with liquid-glass blur panel rising on hover.
- `/client/src/pages/HomePage.jsx` — Integrated `ShowcaseSection` and `CollageGrid` into homepage visual narrative.

**API Changes:**
- `GET /api/filters/colors` — Returns all active colors with display names, hex values, and variant associations.

**Database Changes:**
- Fixed SQLite column additions across `products` and `product_color_variants`.

**Design Tokens & Animation Specs:**
- Colors: Peacock (`#053229`), Spruce (`#355E58`), Sapphire (`#72B0AB`), Arctic (`#BCDDDC`), Lace (`#FFEDD1`), Bubblegum (`#FDC1B4`), Ballet Slipper (`#FE9179`), Sage (`#CFB97E`), Pistachio (`#B89D47`).
- Animations:
  - Card Auto-Cycle: 4000ms interval with 300ms crossfade.
  - Color Swatch Crossfade: 150ms `cubic-bezier(0.4, 0, 0.2, 1)`.
  - Bulk Row Remove Collapse: 300ms `ease-out` with `max-height: 0; opacity: 0; transform: scaleY(0)`.
  - Lightbox Zoom Modal: 250ms scale-in with 20px blur backdrop.
  - Cart Error Shake: 300ms `cubic-bezier(0.36, 0.07, 0.19, 0.97)`.
  - Floating Product Physics: `floatSlow` 6s `ease-in-out` infinite alternate.
  - Liquid-Glass Blur Hover Panel: 350ms `cubic-bezier(0.16, 1, 0.3, 1)`.


---

## Phase 9: Global Bug Fixes, Isolated Liquid Hover & Morphing Search Bar
**Type:** Bug Fix & Style & Feature  
**Files Modified:**
- `/client/src/ProductDetailPage.jsx` — Fixed missing `useRef` hook import from React (`ReferenceError: useRef is not defined` causing blank PDP page on product navigation).
- `/client/src/styles.css` — Added global root resets (`html, body, #root { min-height: 100vh; width: 100%; margin: 0; padding: 0; box-sizing: border-box; }`) and box-sizing normalization across all elements.
- `/client/src/styles/tokens/colors.css` — Formalized the border-radius token system (`--radius-xs: 6px`, `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 24px`, `--radius-full: 9999px`), shadows (`--shadow-card: 0 4px 24px rgba(5, 50, 41, 0.06)`, `--shadow-card-hover: 0 12px 32px rgba(5, 50, 41, 0.12)`), and spacing scale (`--space-1` to `--space-32`).
- `/client/src/components/Home/ProductCard.jsx` & `ProductCard.css` — Implemented 900ms `cubic-bezier(0.22, 1, 0.36, 1)` liquid slide effect with primary image zoom/slide left (`translateX(-4%) scale(1.06)`), secondary image slide in from right (`translateX(0) scale(1.04)`), and liquid gradient overlay sweep (`.shopverse-card__liquid-sweep`). Staggered top-right action buttons with delays of `80ms`, `140ms`, and `200ms` with 100% hover isolation (neighbors remain static).
- `/client/src/components/Navbar.jsx` & `Navbar.css` — Implemented 4-state morphing search bar:
  - **Collapsed State**: Icon-only button (`44px` width, circular border-radius).
  - **Hover State**: Smoothly expands to `220px` with subtle background color shift.
  - **Focus State**: Expands to `420px` with box-shadow ring (`0 0 0 3px rgba(114, 176, 171, 0.25)`) and full background color.
  - **Blur & Clear State**: Automatically collapses back to `44px` on blur if empty, stays open if text is present. Integrated instant clear button (`'X'`) that appears only when text is entered and transitions with `cubic-bezier(0.22, 1, 0.36, 1)`. Autocomplete suggestions strictly capped at 4 items.
- `/client/src/pages/HomePage.css`, `/client/src/pages/ShopPage.css`, `/client/src/WishlistPage.css`, `/client/src/AdminDashboard.css` — Replaced boxy corners with uniform radius tokens and normalized product grid gaps to strict `var(--space-6)` (24px).

- `/client/src/components/Home/ProductCard.css`, `/client/src/ProductDetailPage.css`, `/client/src/components/Home/ShowcaseSection.css`, `/client/src/components/Home/CollageGrid.css`, `/client/src/components/Product/QuickViewModal.css`, `/client/src/styles.css`, `/client/src/AdminDashboard.css` — Removed unnecessary `!important` declarations by enhancing selector specificity and compound class rules across button states and badge overlays.

**API Changes:**
- None (Verified existing contracts)

**Database Changes:**
- None

**Design Tokens & Animation Specs:**
- Border Radius Scale: `--radius-xs: 6px`, `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 24px`, `--radius-full: 9999px`
- Shadows: `--shadow-card: 0 4px 24px rgba(5, 50, 41, 0.06)`, `--shadow-card-hover: 0 12px 32px rgba(5, 50, 41, 0.12)`
- Grid Spacing: Uniform `--space-6: 24px` across all home, shop, and wishlist grids
- Liquid Slide Hover: `900ms cubic-bezier(0.22, 1, 0.36, 1)` with `transform: translateX(-100%)` & `scale(1.06)` for primary, `translateX(0)` for secondary, plus gradient sweep
- Staggered Actions: `80ms`, `140ms`, `200ms` transition delays with 100% hover isolation (zero neighbor shift)
- Morphing Search Bar: `350ms cubic-bezier(0.22, 1, 0.36, 1)` width transitions across 44px (collapsed) -> 220px (hover) -> 420px (focused/has text) states, with auto-collapse on blur when empty and clear button when non-empty

**Verification Checklist Completed:**
- Blank page diagnosis: Verified zero console errors, zero missing imports, zero conditional hook calls. Defensive rendering `?.map` active across all collections.
- Global border-radius: All buttons, inputs, cards, modals, and navbar use system tokens `--radius-sm` through `--radius-full`.
- Grid spacing: Uniform `--space-6: 24px` grid gaps enforced.
- Hover isolation: Card hover animations completely isolated to target card (`.shopverse-card:hover .child`), zero hover bleed.
- Morphing search bar: Smooth state machine execution and blur collapse verified.
- CSS Quality: Zero component `!important` declarations; zero inline styles.
- Build Status: Production bundle builds cleanly (Vite v8.2.2).


