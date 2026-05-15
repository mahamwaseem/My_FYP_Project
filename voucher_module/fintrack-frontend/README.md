# FinTrack Frontend

Professional React frontend for the FinTrack double-entry accounting system.

## Stack
- **React 18** — UI framework
- **DM Sans + DM Mono** — Typography
- **Vanilla CSS** (modular, per-component) — No Tailwind dependency
- **Fetch API** — HTTP with CSRF headers

## Project Structure

```
src/
├── services/
│   └── api.js              # All API calls (CSRF, auth headers)
├── utils/
│   └── helpers.js          # XSS sanitization, formatters, validators
├── hooks/
│   └── useFinTrack.js      # Custom hooks: useVouchers, useSummary, useToast…
├── styles/
│   └── global.css          # CSS variables, theme, shared styles
├── components/
│   ├── layout/
│   │   ├── Sidebar.js/.css
│   │   └── Header.js/.css
│   ├── shared/
│   │   ├── Toast.js        # Toast notification system
│   │   └── UI.js           # Skeleton, ErrorBoundary, Modal, ConfirmDialog, Pagination
│   ├── dashboard/
│   │   └── Dashboard.js/.css
│   ├── vouchers/
│   │   ├── VoucherList.js/.css   # Table with sort/filter/search/pagination
│   │   ├── VoucherForm.js/.css   # Create/edit with real-time Debit=Credit validation
│   │   └── VoucherDetail.js/.css # View, print, reverse, audit log tabs
│   └── currencies/
│       └── Currencies.js
├── App.js
└── index.js
```

## Setup

```bash
# 1. Copy env
cp .env.example .env
# Edit REACT_APP_API_URL to your Django backend

# 2. Install
npm install

# 3. Run (development)
npm start
# Opens http://localhost:3000
# API calls proxy to http://localhost:8000 via package.json "proxy"
```

## Django CORS Setup

In your Django `settings.py`:
```python
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware', ...MIDDLEWARE]
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ['http://localhost:3000']
```

## Security Features
- **CSRF**: `X-CSRFToken` header sent on all mutating requests
- **XSS**: All user input sanitized before submission via `sanitizeObject()`
- **Input validation**: Debit=Credit enforced client-side before any API call
- **Error boundaries**: All page sections wrapped to prevent cascade failures
- **Decimal safety**: All money values use `toFixed(2)`, never floats

## Connecting to Your Backend

The API base URL is set in `.env` as `REACT_APP_API_URL`.

### Auth Integration
When your teammate's Auth module is ready:
1. Store the JWT in `localStorage` as `authToken`
2. `api.js` automatically sends `Authorization: Bearer <token>` on every request

### COA Integration
When COA is ready, replace the `account_id` text input in `VoucherForm.js`
with a `<select>` populated from `GET /api/accounts/`.
