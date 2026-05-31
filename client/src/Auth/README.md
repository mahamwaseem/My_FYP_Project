# FinTrack — Authentication & Authorization (frontend)

Secure login/registration + **role-based access control** for the three roles
from the proposal: **Administrator · Accountant · User/Viewer**. Enterprise /
SAP-style UI in the FinTrack brand (teal/white/black, Sora + Inter + IBM Plex
Mono, crisp SVG icons). API-first with a demo fallback so it runs before the
backend exists.

## What it does
- **Sign in / Register** — JWT-based; the whole app sits behind a login gate.
- **Role-based authorization** — every action/route checks the user's role.
  - Frontend **gates the UX** (hides/disables what you can't do).
  - Backend **enforces** it (the real security) — built next.
- **Admin user management** — list users, change roles, enable/disable accounts, add users.
- **Access Denied** screen for unauthorized areas; **boot splash** while the session restores.

## The roles & permission matrix
| Area | Administrator | Accountant | Viewer |
|---|:---:|:---:|:---:|
| View dashboard / COA / vouchers / ledger / statements / reporting | ✅ | ✅ | ✅ |
| Create/edit/post vouchers · manage COA · apply templates | ✅ | ✅ | ❌ |
| User management · system settings | ✅ | ❌ | ❌ |

Defined once in `services/authConstants.js` (`ROLE_PERMISSIONS`, `can()`).

## Install
Copy the `Auth/` folder into `src/`, then:

**1. Wrap your app in the gate** (in `App.js`):
```jsx
import { AuthGate } from './Auth';

export default function App() {
  return (
    <AuthGate>
      {/* your existing app — only renders once signed in */}
      <YourAppRoutes />
    </AuthGate>
  );
}
```

**2. Add the user menu to your navbar** (avatar + role + logout + link to user mgmt):
```jsx
import { UserMenu } from './Auth';
<UserMenu onManageUsers={() => onNavigate('users')} />
```

**3. Route to the admin console** (admins only):
```jsx
import { AdminUsers, RequirePermission, PERMISSIONS } from './Auth';

{currentPage === 'users' && (
  <RequirePermission perm={PERMISSIONS.MANAGE_USERS} onBack={goHome}>
    <AdminUsers onBack={goHome} />
  </RequirePermission>
)}
```

**4. Gate actions across your modules** — e.g. hide/disable "New Voucher" for viewers:
```jsx
import { Can, PERMISSIONS } from './Auth';

<Can perm={PERMISSIONS.MANAGE_VOUCHERS}>
  {(allowed) => (
    <button disabled={!allowed} title={allowed ? '' : 'Insufficient permissions'}>
      New Voucher {!allowed && '🔒'}
    </button>
  )}
</Can>
```
Or use `useAuth()` directly: `const { can, hasRole, user } = useAuth();`

## Demo mode (before the backend)
- Sign in with **`admin@mts.pk` / `admin123`** to explore as an Administrator.
- The Admin console shows demo users (flagged). Role changes / enable-disable
  update the UI optimistically. All of it switches to live data once the backend
  is connected — no code change.

## Structure
```
Auth/
  AuthGate.jsx                  wrap-the-app login gate (+ provider)
  index.js                      barrel — import everything from './Auth'
  context/AuthContext.jsx       current user, login/register/logout, can()/hasRole()
  services/
    authApi.js                  JWT service layer + token store + auto-refresh
    authConstants.js            roles, permission matrix, can(), demo data
  hooks/useAuthHooks.js         toasts + admin users hook (list/role/status/create)
  components/
    auth/{AuthPage.jsx, Guards.jsx}     sign-in console + route guards
    admin/AdminUsers.jsx                user-management console + modals
    shared/{Icon.js, Toast.js, UserMenu.jsx}
  styles/auth.css
```

## Backend it expects (built next) — `/api/auth/`
- `POST register/` `{name,email,password,confirm_password}` → `{access,refresh,user}`
- `POST login/` `{email,password}` → `{access,refresh,user}`
- `POST token/refresh/` `{refresh}` → `{access}`
- `GET  profile/` → `{id,name,email,role,status}`
- `POST logout/` `{refresh}`
- `GET  users/` (admin) → `[{id,user_id,name,email,role,status,last_login}]`
- `POST users/` (admin) `{name,email,password,role}`
- `PATCH users/{id}/role/` `{role}` · `PATCH users/{id}/status/` `{status}`

Passwords are hashed server-side (Django). The audit log's `performed_by` becomes
real users once this is wired in.
