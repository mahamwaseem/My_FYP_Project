# FinTrack — Reporting backend (app: `reporting`)

Powers the Reporting module's 5 reports. **No models, no migration** — it's
read-only aggregation that reuses `general_ledger` (trial_balance,
account_ledger, posted_lines_qs, classify_account) and the `vouchers` audit log.
`manage.py check` → 0 issues.

## Install
1. Copy the `reporting/` folder into your project root (next to accounts/, vouchers/, reports/, templates/).
2. Two additive edits (see config_reference/):
   - settings.py : add `'reporting'` to INSTALLED_APPS (after `'templates'`)
   - urls.py     : add `path('api/reporting/', include('reporting.urls'))`
3. No migration needed. `python manage.py check` → 0 issues, then runserver.

## Endpoints — `/api/reporting/`  ({ success, data })
- `GET account-balances/?date_to=`                    → every account + closing balance + Dr/Cr, with balanced totals
- `GET transaction-summary/?date_from=&date_to=`      → postings per account (debit/credit/net/count) + voucher/txn counts
- `GET audit-trail/?date_from=&date_to=`              → chronological voucher action log
- `GET account-statement/?account=&date_from=&date_to=` → one account, movements + running balance + closing (account by id or name)
- `GET custom-summary/?date_from=&date_to=`           → comparative current-vs-prior (income, expenses, net, assets, equity)
- `GET <report>/export/?format=csv|json`              → export any report (report ∈ balances|txns|audit|account|summary)

All amounts are fixed 2-decimal strings. The frontend's reportingApi.js maps
1:1 to these paths; flip it off demo mode by pointing at the live API.

## Validated
Fresh SQLite build (Django 5.2.11 + DRF + django-filter): seeded a clean set
(capital 200k, sales 90k+60k, rent 35k, salary 50k). 28/28 checks passed —
balances balanced (Bank 265k Dr), transaction summary counts + totals, audit
trail shape, account statement running balance + closing, custom summary
(income 150k / expenses 85k / net 65k), and CSV+JSON export with 404 handling.
