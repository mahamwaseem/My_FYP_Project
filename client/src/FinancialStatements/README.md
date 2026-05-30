# FinTrack — Financial Statements Module (frontend)

A drop-in React module that generates the four standard financial statements
through a clean, workflow-driven UI — **no sidebar**. Mirrors the General Ledger /
Vouchers module conventions: API-first hooks with a graceful **demo fallback**,
`{ success, data }` response handling, toast store, self-contained stylesheet.
Teal / black / white.

## Layout

- **Top bar** — brand, title, and a live "ledger in balance" indicator. No sidebar.
- **Main area** — "Generate Statements" heading, a KPI ribbon, then four
  **statement cards** (Balance Sheet, Income, Cash Flow, Trial Balance), each with
  an icon, a **Ready / Draft** status, and a Preview action. Selecting a card
  renders it in the **inline preview window** below, whose dark bar carries an
  **Export ▾** menu (PDF · Excel · Print).
- **Generation Controls panel (right)** — segmented **Monthly / Quarterly /
  Annually**, **date pickers**, a **Comparative figures (prior year)** toggle, and
  a prominent **Generate & Export Statements** button.

## Install

Copy the `FinancialStatements/` folder into `src/` next to your other modules,
then route to it in `App.js`:

```jsx
import FinancialStatementsPage from './FinancialStatements/FinancialStatementsPage';
// ...
{currentPage === 'reports' && <FinancialStatementsPage onBack={goHome} />}
```

Point a button at `onNavigate('reports')` to open it.

## Structure

```
FinancialStatements/
  FinancialStatementsPage.jsx      composer: top bar + cards + preview + controls
  services/
    statementsApi.js               /api/reports/ service layer (mirrors glApi)
    mockData.js                    demo figures incl. prior-year comparatives
  hooks/
    useStatements.js               useStatement, useStatementOverview, toasts
  utils/
    statementHelpers.js            formatting, CSV/print export
  components/
    shared/{Toast.js, Icon.js}
    statements/{Parts.js, BalanceSheet.js, IncomeStatement.js, CashFlow.js, TrialBalance.js}
  styles/statements.css
```

## Backend it expects (when you build it)

`/api/reports/` with `{ period, date_from, date_to, comparative }` params,
returning `{ success, data }`:

- `balance-sheet/`    → `{ assets[], liabilities[], equity[], total_assets, total_liabilities, total_equity, total_liabilities_equity, balanced }`
- `income-statement/` → `{ income[], expenses[], total_income, total_expenses, net_profit, is_profit, margin_pct }`
- `cash-flow/`        → `{ operating[], investing[], financing[], total_*, net_change, opening_cash, closing_cash }`
- `trial-balance/`    → `{ rows[{name, code, type, debit, credit}], total_debit, total_credit, balanced }`
- `summary/`          → `{ total_assets, net_profit, is_profit, total_debit, total_credit, balanced, accounts, statuses{} }`

Each section row is `{ name, code?, amount, prior? }` (include `prior` when
`comparative=1`). All statements derive from the same posted ledger lines the
General Ledger reads — Trial Balance already exists in the GL backend at
`/api/gl/trial-balance/` and can be reused.

Until those endpoints exist, the module shows clearly-flagged demo data.
```
