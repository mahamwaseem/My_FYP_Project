# FinTrack — Voucher Templates Module (frontend)

Reusable, pre-filled **double-entry voucher templates** for recurring transactions
(rent, utilities, salaries, depreciation…). The accounts are locked by the
template; only **amount, date and description** are editable at apply time. Every
entry validates **Debit = Credit**, and applying a template creates a real,
auditable voucher through the existing Vouchers module.

Same architecture as the other modules: API-first hooks with a graceful **demo
fallback**, `{ success, data }` handling, toast store, self-contained `.vt` CSS.
Teal / black / white, Sora + Inter + IBM Plex Mono.

## What it does

- **Three template families** matching the proposal: **Receipt (RV)**, **Payment (PV)**,
  **Journal (JV)** vouchers — 10 ready-made templates built in.
- **Pre-filled Dr/Cr accounts** shown on every card as a mini double-entry preview.
- **Apply drawer** — slides in, accounts locked, edit amount/date/description,
  live **Debit = Credit** balance check, optional **recurring** schedule
  (daily → yearly), then **Create Voucher**.
- **Search + filter** by type, hero with live counts.
- Fully auditable: applying creates a posted voucher via the Vouchers API.

## Layout

Hero (teal gradient, "Voucher Templates") → sticky search + filter pills →
responsive grid of template cards → slide-in **Apply** drawer over a dimmed scrim.

## Install

Copy the `VoucherTemplates/` folder into `src/` next to your other modules, then
route to it in `App.js`:

```jsx
import TemplatesPage from './VoucherTemplates/TemplatesPage';
// ...
{currentPage === 'templates' && <TemplatesPage onBack={goHome} />}
```

(Replaces the previous `./templates/TemplatesPage` import — point your existing
"Voucher Templates" nav button at `onNavigate('templates')`.)

## Structure

```
VoucherTemplates/
  TemplatesPage.jsx            hero + search/filters + grid + apply drawer
  services/
    templatesApi.js            /api/templates/ service layer (mirrors glApi)
    mockData.js                the 10 built-in templates + account list
  hooks/
    useTemplates.js            useTemplates, useApplyTemplate, toasts
  utils/
    templateHelpers.js         formatting, Debit=Credit validation, payload build
  components/
    shared/{Toast.js, Icon.js}
    TemplateCard.js            one template, with its Dr→Cr flow visual
    ApplyTemplate.js           the slide-in apply drawer
  styles/templates.css
```

## Backend it expects (when you build it)

`/api/templates/` returning `{ success, data }`:

- `GET  templates/`            → list `[{ id, type, name, description, amount, recurring, frequency?, tag, lines[{account, side}] }]`
- `GET  templates/{id}/`       → one template
- `POST templates/`            → create · `PATCH`/`DELETE templates/{id}/` → manage
- `POST templates/{id}/apply/` → create a voucher from the template.
  Body: `{ v_type, date, description, amount, lines[{account, debit, credit}], post, recurring?, frequency? }`
  Returns the created voucher (`{ voucher_no, … }`).

A natural backend: a `VoucherTemplate` + `VoucherTemplateLine` model, and an
`apply` action that builds a `VoucherHeader` + `VoucherDetail` lines (and a
`RecurringSchedule` when `recurring`), then calls the existing
`VoucherHeader.post()` — so generated vouchers are validated and posted exactly
like manual ones. Until then, the module runs on the built-in templates and
simulates voucher creation (clearly flagged).
