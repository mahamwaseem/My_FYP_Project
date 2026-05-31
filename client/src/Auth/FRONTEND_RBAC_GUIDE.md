# Wiring role-based UI gating into your existing module pages

The **backend now enforces** roles (a Viewer's create/edit/post/delete returns
403 — the real security). This guide adds the **UX layer**: show those buttons
**disabled with a lock** for Viewers, instead of clickable buttons that error.

You only need to touch the buttons that DO things (New / Edit / Post / Delete /
Apply). View/list/search stay open to everyone.

---

## The one tool you need: `<Can>` (already in your Auth module)

`<Can perm={...}>` renders its children with an `allowed` boolean. Wrap any
action button with it.

```jsx
import { Can, PERMISSIONS } from '../Auth';   // adjust the relative path to reach src/Auth
```

(From `src/Vouchers/components/vouchers/VoucherList.js`, the path is `'../../../Auth'`.
From `src/Vouchers/VouchersPage.jsx`, it's `'../Auth'`. Count the folders up to `src/`.)

---

## Example 1 — Vouchers "＋ New Voucher" button

**Find this in `VoucherList.js`:**
```jsx
<button
  className="btn btn-primary"
  onClick={() => { setEditVoucher(null); setShowForm(true); }}
>
  + New Voucher
</button>
```

**Replace with:**
```jsx
<Can perm={PERMISSIONS.MANAGE_VOUCHERS}>
  {(allowed) => (
    <button
      className="btn btn-primary"
      disabled={!allowed}
      title={allowed ? '' : 'Viewers have read-only access'}
      onClick={() => { if (allowed) { setEditVoucher(null); setShowForm(true); } }}
    >
      {allowed ? '+ New Voucher' : '🔒 New Voucher'}
    </button>
  )}
</Can>
```

Do the same for any **Edit**, **Post**, **Delete**, **Reverse** buttons in
`VoucherList.js` / `VoucherDetail.js` — wrap each in
`<Can perm={PERMISSIONS.MANAGE_VOUCHERS}>` the same way.

---

## Example 2 — Chart of Accounts "Add" buttons

In your COA pages (`Accountgroup.jsx`, etc.), wrap the create/edit/delete
buttons:
```jsx
<Can perm={PERMISSIONS.MANAGE_COA}>
  {(allowed) => (
    <button disabled={!allowed} title={allowed ? '' : 'Read-only for your role'}
      onClick={() => { if (allowed) openCreate(); }}>
      {allowed ? '+ Add Group' : '🔒 Add Group'}
    </button>
  )}
</Can>
```

---

## Example 3 — Voucher Templates "Apply" button

```jsx
<Can perm={PERMISSIONS.USE_TEMPLATES}>
  {(allowed) => (
    <button disabled={!allowed} title={allowed ? '' : 'Read-only for your role'}
      onClick={() => { if (allowed) applyTemplate(t); }}>
      {allowed ? 'Apply' : '🔒 Apply'}
    </button>
  )}
</Can>
```

---

## Optional: a cleaner disabled style

Add to any module CSS so locked buttons look intentionally disabled:
```css
.btn:disabled,
button:disabled { opacity: .55; cursor: not-allowed; }
```

---

## Permissions reference (what each gate checks)
| Button | Permission |
|---|---|
| New / Edit / Post / Delete / Reverse voucher | `PERMISSIONS.MANAGE_VOUCHERS` |
| Add / Edit / Delete account (COA) | `PERMISSIONS.MANAGE_COA` |
| Apply / create / edit template | `PERMISSIONS.USE_TEMPLATES` |

Admin + Accountant hold all three; Viewer holds none → their buttons show the
lock and are disabled.

---

## What you do NOT need to gate
- Lists, tables, search, filters, view/detail screens → everyone may read.
- Financial Statements & Reporting pages → read-only by nature; leave open.

---

## Why both layers?
- **Backend (done):** rejects unauthorized writes with 403 — real security, can't be bypassed.
- **Frontend (this):** hides/disables what you can't do — clean UX so users don't click buttons that would just error.

The backend already protects you. This guide just makes the UI match.
