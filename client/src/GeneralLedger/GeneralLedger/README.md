# FinTrack — General Ledger Management Module

A drop-in React module for the FinTrack accounting app, built to match the
conventions of the existing **Voucher** and **Chart of Accounts** modules
(same design system, same folder layout, same API/hook/helper patterns).

## Features

1. **Account Ledger** (`components/gl/AccountLedger.js`) — detailed per-account
   view with opening balance, every debit/credit line, a **running balance**
   per row, period totals, and date-range presets.
2. **Transaction Search** (`components/gl/TransactionSearch.js`) — advanced
   search & filter over all historical entries (keyword, account, voucher type,
   debit/credit side, date range, min/max amount), sortable results, filter
   chips, pagination, and **CSV export**.
3. **Posting Center** (`components/gl/PostingCenter.js`) — posts pending
   vouchers to their ledgers. Manual per-row posting, post-all, and an
   **auto-post** toggle that drains balanced vouchers automatically. Unbalanced
   vouchers are blocked from posting. Includes a posting log (posted / failed).
4. **Bank Reconciliation** (`components/gl/Reconciliation.js`) — pick a
   bank/cash account, enter the statement closing balance, tick off cleared
   entries, and finalize once `Statement − Cleared Book Balance = 0.00`.

A **GL Dashboard** (`components/gl/LedgerDashboard.js`) ties them together with
KPI cards and a clickable Trial Balance snapshot.

## Integration

```jsx
import GeneralLedgerPage from './GeneralLedger/GeneralLedgerPage';

<GeneralLedgerPage
  onBack={() => goHome()}                 // optional: renders a "Back Home" button
  onAppNavigate={(target) => routeTo(target)} // optional: 'vouchers' | 'account-group'
/>
```

The module is fully self-contained — it ships its own copies of the shared UI,
toast system, and layout (Sidebar/Header) so it drops in alongside the Voucher
module without import collisions. It imports its own `styles/global.css`.

Set the API base URL via `REACT_APP_API_URL` (defaults to
`http://localhost:8000/api`), exactly like the Voucher module.

## Expected backend endpoints (prefix `/gl/`)

| Feature | Method · Endpoint |
|---|---|
| Accounts list | `GET /gl/accounts/` |
| Trial balance | `GET /gl/trial-balance/` |
| GL summary (KPIs) | `GET /gl/summary/` |
| Account ledger (F1) | `GET /gl/accounts/{id}/ledger/` |
| Transactions (F2) | `GET /gl/transactions/` |
| Transactions export (F2) | `GET /gl/transactions/export/` |
| Posting queue (F3) | `GET /gl/posting/queue/` |
| Posting log (F3) | `GET /gl/posting/log/` |
| Post one (F3) | `POST /gl/posting/{id}/post/` |
| Post batch / all (F3) | `POST /gl/posting/post-batch/`, `POST /gl/posting/post-all/` |
| Auto-post flag (F3) | `POST /gl/posting/auto/` |
| Reconciliations (F4) | `GET/POST /gl/reconciliations/`, `GET /gl/reconciliations/{id}/` |
| Unreconciled lines (F4) | `GET /gl/accounts/{id}/unreconciled/` |
| Match / unmatch (F4) | `POST /gl/reconciliations/{id}/match/`, `.../unmatch/` |
| Finalize (F4) | `POST /gl/reconciliations/{id}/finalize/` |

Responses may be a bare array, `{ data: [...] }`, or `{ results: [...] }` — all
three shapes are unwrapped automatically (matches the Voucher module).

## Accessibility (built for low-vision readability)

- **16px base** (vs 14px elsewhere). All component type is sized in `em`, so the
  whole module scales from a single `--gl-base` variable on `.gl-app`.
- **Runtime text-size control** in the header — A / A+ / A++ → 16 / 18 / 20px.
- **Tabular, lining figures** (`font-variant-numeric: tabular-nums lining-nums`)
  on every amount so columns align and digits are easy to scan.
- Stronger text contrast, larger hit targets (≥40px buttons, 42px inputs),
  visible focus rings, and `prefers-reduced-motion` support.

## Demo fallback (offline preview)

Every data hook is **API-first** but falls back to seed data in
`services/mockData.js` when the API is empty or unreachable, so the module is
fully clickable with no backend. To go live-only, search the codebase for the
comment marker:

```
DEMO FALLBACK
```

and remove those branches in `hooks/useGeneralLedger.js`,
`components/gl/Reconciliation.js`, and `components/gl/PostingCenter.js`, plus
delete `services/mockData.js`.

## File layout

```
GeneralLedger/
├─ GeneralLedgerPage.jsx          # top-level composer (state + layout)
├─ components/
│  ├─ gl/                         # the four features + dashboard (+ .css)
│  ├─ layout/  (Sidebar, Header)  # Header hosts the text-size control
│  └─ shared/  (UI, Toast)
├─ hooks/useGeneralLedger.js      # toast store + data hooks + useDebounce
├─ services/  (glApi.js, mockData.js)
├─ utils/glHelpers.js             # formatting, balances, reconciliation math
└─ styles/global.css             # FinTrack tokens + accessibility tuning
```
