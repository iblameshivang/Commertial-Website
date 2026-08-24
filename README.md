# Shopverse — Curated Luxury eCommerce

A full-stack eCommerce platform built with React (Vite) + Express + SQLite.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd Commertial-Website-1
cd server && npm install
cd ../client && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set real values for JWT_SECRET and ADMIN_PASSWORD

# 3. Run
cd server && npm start
cd ../client && npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables. The server **will not start** in production mode without:
- `JWT_SECRET` — random 32+ character string for signing JWTs
- `ADMIN_PASSWORD` — admin account password
- `ALLOWED_ORIGIN` — your frontend domain for CORS
- `NODE_ENV=production` — enables security hardening

## ⚠️ Security Warning — Credential Rotation Required

> **If you cloned this repository from a point where credentials were hardcoded in source code, those old values (`ShopverseSecretKey2026`, `MissionNepal`, `seller123`, `customer123`) are still in git history.**
>
> **You MUST:**
> 1. Set new, unique values for `JWT_SECRET` and `ADMIN_PASSWORD` in your `.env` file
> 2. Change all seed user passwords via the admin panel after first deployment
> 3. Never reuse the default credentials in any environment
> 4. Consider running `git filter-branch` or BFG Repo-Cleaner to purge old secrets from history if this repo will be made public

## Architecture

```
client/          React SPA (Vite)
  src/
    components/  Reusable UI components
    pages/       Page-level route components
    utils/       API client, helpers
    styles/      CSS design tokens
server/
  index.js       Express API server
  db.js          SQLite schema + seed data
  colors.js      Color palette engine
```

## Security Features

- **JWT authentication** with bcrypt password hashing
- **Rate limiting** on login (5/min) and registration (3/hr)
- **Helmet** security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** restricted to configured origin in production
- **Parameterized SQL queries** — no string interpolation
- **File upload validation** — MIME type whitelist
- **PII redaction** on order lookup responses
- **Input sanitization** — HTML tag stripping on user submissions
