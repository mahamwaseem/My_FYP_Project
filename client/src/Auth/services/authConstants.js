// ============================================================================
// FinTrack — Auth roles, permission matrix, demo data
// Single source of truth for the three roles and what each can do.
// The frontend uses this to GATE the UX (hide/disable). The backend ENFORCES
// the same matrix server-side (the real security).
// ============================================================================

export const COMPANY = { name: 'Multi Tech Solutions' };

// ── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  admin:      { key: 'admin',      code: 'ADM', label: 'Administrator', icon: 'crown',
                desc: 'Full system access · user management · settings' },
  accountant: { key: 'accountant', code: 'ACC', label: 'Accountant', icon: 'ledger',
                desc: 'Record transactions · reports · manage accounts' },
  viewer:     { key: 'viewer',     code: 'VWR', label: 'User / Viewer', icon: 'eye',
                desc: 'Read-only access to selected financial data' },
};
export const ROLE_LIST = [ROLES.admin, ROLES.accountant, ROLES.viewer];

// ── Permissions ──────────────────────────────────────────────────────────────
// A permission string is what an action/route requires. We map each role to the
// set of permissions it holds. `can(role, perm)` checks membership.
export const PERMISSIONS = {
  // view (read) — all roles
  VIEW_DASHBOARD:   'view_dashboard',
  VIEW_COA:         'view_coa',
  VIEW_VOUCHERS:    'view_vouchers',
  VIEW_LEDGER:      'view_ledger',
  VIEW_STATEMENTS:  'view_statements',
  VIEW_REPORTING:   'view_reporting',
  // write (accounting) — admin + accountant
  MANAGE_COA:       'manage_coa',
  MANAGE_VOUCHERS:  'manage_vouchers',   // create/post/edit/delete
  USE_TEMPLATES:    'use_templates',
  // administration — admin only
  MANAGE_USERS:     'manage_users',
  SYSTEM_SETTINGS:  'system_settings',
};

const VIEW_PERMS = [
  PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_COA, PERMISSIONS.VIEW_VOUCHERS,
  PERMISSIONS.VIEW_LEDGER, PERMISSIONS.VIEW_STATEMENTS, PERMISSIONS.VIEW_REPORTING,
];
const ACCOUNTING_PERMS = [
  PERMISSIONS.MANAGE_COA, PERMISSIONS.MANAGE_VOUCHERS, PERMISSIONS.USE_TEMPLATES,
];
const ADMIN_PERMS = [PERMISSIONS.MANAGE_USERS, PERMISSIONS.SYSTEM_SETTINGS];

// role → permissions it holds
export const ROLE_PERMISSIONS = {
  admin:      [...VIEW_PERMS, ...ACCOUNTING_PERMS, ...ADMIN_PERMS],
  accountant: [...VIEW_PERMS, ...ACCOUNTING_PERMS],
  viewer:     [...VIEW_PERMS],
};

// Does `role` hold `perm`?
export function can(role, perm) {
  if (!role) return false;
  const list = ROLE_PERMISSIONS[role] || [];
  return list.includes(perm);
}

// Human-readable matrix (used on an access/help panel if needed)
export const ACCESS_MATRIX = [
  { area: 'Dashboard',                  perm: PERMISSIONS.VIEW_DASHBOARD },
  { area: 'Chart of Accounts — view',   perm: PERMISSIONS.VIEW_COA },
  { area: 'Chart of Accounts — manage', perm: PERMISSIONS.MANAGE_COA },
  { area: 'Vouchers — view',            perm: PERMISSIONS.VIEW_VOUCHERS },
  { area: 'Vouchers — create/post',     perm: PERMISSIONS.MANAGE_VOUCHERS },
  { area: 'Voucher Templates — apply',  perm: PERMISSIONS.USE_TEMPLATES },
  { area: 'General Ledger — view',      perm: PERMISSIONS.VIEW_LEDGER },
  { area: 'Financial Statements',       perm: PERMISSIONS.VIEW_STATEMENTS },
  { area: 'Reporting',                  perm: PERMISSIONS.VIEW_REPORTING },
  { area: 'User Management',            perm: PERMISSIONS.MANAGE_USERS },
  { area: 'System Settings',            perm: PERMISSIONS.SYSTEM_SETTINGS },
];

// ── Demo users (fallback before backend exists) ──────────────────────────────
export const DEMO_USERS = [
  { id: 1, user_id: 'USR-001', name: 'Ayesha Khan', email: 'ayesha@mts.pk', role: 'admin', status: 'active', last_login: '2026-05-30 14:02' },
  { id: 2, user_id: 'USR-002', name: 'Bilal Ahmed', email: 'bilal@mts.pk', role: 'accountant', status: 'active', last_login: '2026-05-30 11:47' },
  { id: 3, user_id: 'USR-003', name: 'Sana Riaz', email: 'sana@mts.pk', role: 'viewer', status: 'active', last_login: '2026-05-29 18:30' },
  { id: 4, user_id: 'USR-004', name: 'Usman Tariq', email: 'usman@mts.pk', role: 'accountant', status: 'disabled', last_login: '2026-05-12 09:15' },
];

// Demo "current user" used when running without a backend
export const DEMO_CURRENT_USER = { id: 1, name: 'Ayesha Khan', email: 'ayesha@mts.pk', role: 'admin', status: 'active' };
