# FinTrack — Financial Statements & Reports (Django app: `reports`)

Generates the four standard financial statements **from posted ledger data**, for
any reporting period, with prior-year comparatives and CSV/JSON export. It stores
**no data of its own** — every figure is computed on request from the same posted
`VoucherDetail` lines the General Ledger reads, so the statements are always
consistent with the ledger and with each other.

## Built entirely on the prerequisite modules (never re-implemented)

| Dependency | Used for |
|---|---|
| `accounts` (Chart of Accounts) | the account hierarchy + the five classifications |
| `vouchers` (posted entries) | the raw debits / credits (`VoucherDetail`, `VoucherStatus.POSTED`) |
| `general_ledger` | `posted_lines_qs()`, `classify_account()`, `trial_balance()` — reused as-is |

Account types come from `general_ledger.classify_account()`:
`ASSET, EXPENSE → debit-normal`; `LIABILITY, EQUITY, INCOME → credit-normal`.

## Endpoints — mounted at `/api/reports/`

All accept query params: `period` (monthly|quarterly|annually), `date_from`,
`date_to` (YYYY-MM-DD, override `period`), `comparative` (1|true → prior-year).
Response shape is `{ "success": true, "data": … }` to match the rest of the API.

| Method & path | Returns |
|---|---|
| `GET summary/` | KPIs + per-card statuses `{ total_assets, net_profit, is_profit, total_debit, total_credit, balanced, accounts, statuses{} }` |
| `GET balance-sheet/` | `{ assets[], liabilities[], equity[], total_assets, total_liabilities, total_equity, total_liabilities_equity, balanced }` |
| `GET income-statement/` | `{ income[], expenses[], total_income, total_expenses, net_profit, is_profit, margin_pct }` |
| `GET cash-flow/` | `{ operating[], investing[], financing[], total_*, net_change, opening_cash, closing_cash }` |
| `GET trial-balance/` | `{ rows[{id,code,name,type,debit,credit}], total_debit, total_credit, balanced }` |
| `GET <statement>/export/?format=csv\|json` | CSV download (default) or the JSON payload. PDF/Print are produced client-side. |

Section rows are `{ id, code, name, amount, prior? }` (`prior` present only when
`comparative=1`). `code` is the account id as a string (the COA `Account` has no
separate code column).

## Accounting model

- **Balance Sheet** (as-of `date_to`): cumulative normal-side balances of ASSET vs
  LIABILITY + EQUITY. The period's **net profit is rolled into Equity as
  "Retained Earnings (current)"** — this is the link that makes Assets = L + E.
- **Income Statement** (over `date_from..date_to`): INCOME − EXPENSE movement.
- **Cash Flow** (over the window): movement on cash/bank accounts (name contains
  *cash/bank/petty*), each contra-line bucketed into **Operating / Investing /
  Financing** by the *other* accounts on the voucher:
    - counter-account is EQUITY → **Financing**
    - counter-account is working capital (receivable, payable, inventory, tax,
      salary…) → **Operating**
    - counter-account is a long-term ASSET only (equipment, property) → **Investing**
    - income / expense / anything else → **Operating**
  Opening cash = cumulative cash balance before the window; closing = opening + net.
- **Trial Balance** → `general_ledger.services.trial_balance()` verbatim.

## Validation performed

Validated end-to-end on a clean SQLite build (Django 5.2.11 + DRF + django-filter):
seeded a 5-classification COA and 9 posted vouchers, then exercised all five
endpoints + CSV/JSON export + the comparative path. All accounting identities
hold:

- Balance Sheet balances (Assets == Liabilities + Equity) ✅
- Trial Balance balances (Σ Debit == Σ Credit) ✅
- Net profit == Income − Expenses ✅
- Cash-flow net == Operating + Investing + Financing, closing == opening + net ✅
- **Cross-check:** Balance-Sheet (Cash + Bank) == Cash-Flow closing cash ✅

The app declares **no models**, so it needs no migrations (`manage.py check` → 0 issues).

## Install (already wired in this project)

1. `INSTALLED_APPS += ['reports']`  (after `'general_ledger'`)
2. `path('api/reports/', include('reports.urls'))`  in `config/urls.py`

Nothing else — the app reads everything through the existing modules. See
`config_reference/` for the exact two additive lines.
