# FinTrack — Reporting Module (frontend)

A report **generator**: pick a report type, set a time period (monthly /
quarterly / annually, or a custom date range), and generate it from posted
ledger data. Covers the operational + financial reports from the proposal that
the Financial Statements module doesn't: Account Balances, Transaction Summary,
Audit Trail, Account Statement, and a comparative Custom Summary.

Same architecture as the other modules — API-first hooks with a graceful **demo
fallback**, `{ success, data }` handling, toasts, self-contained `.rp` CSS.
Brand: teal / white / black, Sora + Inter + IBM Plex Mono, crisp SVG icons.
Unique layout: a **left report-builder rail + a report-sheet canvas**.

## Reports
1. **Account Balances** — every account + closing balance as of a date, totals balanced.
2. **Transaction Summary** — postings over a period, totalled by account (Dr/Cr/Net/entries).
3. **Audit Trail** — chronological log of voucher actions (created/posted/reversed) with who & when.
4. **Account Statement** — one account, every movement, running balance (account picker).
5. **Custom Summary** — comparative management overview (current vs prior period, change %).

## Time periods
Monthly / Quarterly / Annually presets auto-fill the date range; the two date
inputs allow any custom range. Period drives every report.

## Export
Each report exports to **CSV** (real download) or **Print / PDF** (scoped print
window of the report sheet). Per-report CSV builders live in `hooks/useReporting.js`.

## Install
Copy the `Reporting/` folder into `src/`, then route to it in `App.js`:

```jsx
import ReportingPage from './Reporting/ReportingPage';
// ...
{currentPage === 'reporting' && <ReportingPage onBack={goHome} />}
```

Add a nav entry pointing at `onNavigate('reporting')`. (Note: this is the
broader Reporting module — distinct from `reports` / Financial Statements, which
renders the 4 formal statements.)

## Structure
```
Reporting/
  ReportingPage.jsx              rail + controls + canvas + export
  services/
    reportingApi.js              /api/reporting/ service layer
    mockData.js                  report registry + demo payloads
  hooks/
    useReporting.js              useReport (demo fallback), toCSV, toasts
  utils/
    reportHelpers.js             formatting, period resolution, CSV/print
  components/
    shared/{Icon.js, Toast.js}
    reports/{Parts.js, AccountBalances.js, TransactionSummary.js,
             AuditTrail.js, AccountStatement.js, CustomSummary.js}
  styles/reporting.css
```

## Backend it expects (when built)
`/api/reporting/` returning `{ success, data }`:
- `GET account-balances/?date_to=` → `{ rows[{code,name,type,balance,side}], total_debit, total_credit, balanced }`
- `GET transaction-summary/?date_from=&date_to=` → `{ rows[{code,name,type,debit,credit,net,count}], total_debit, total_credit, transaction_count, voucher_count }`
- `GET audit-trail/?date_from=&date_to=` → `{ rows[{ts,voucher,action,by,note}], count }`
- `GET account-statement/?account=&date_from=&date_to=` → `{ account, opening, rows[{date,voucher,particulars,debit,credit,balance}], total_debit, total_credit, closing, closing_side }`
- `GET custom-summary/?date_from=&date_to=` → `{ current_label, prior_label, groups[{label,current,prior,emphasis?}] }`
- `GET <report>/export/?format=csv|json`

These can reuse the existing `general_ledger` services (trial_balance,
account_ledger, posted_lines_qs) + the `vouchers` audit log — most of the data
already exists server-side. Until then, the module runs on demo data (flagged).
