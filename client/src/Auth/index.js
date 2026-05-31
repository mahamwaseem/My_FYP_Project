// ============================================================================
// FinTrack — Auth module public API (barrel)
// Import everything you need from one place:
//   import { AuthGate, useAuth, Can, AdminUsers, UserMenu, PERMISSIONS } from './Auth';
// ============================================================================
export { default as AuthGate } from './AuthGate';
export { AuthProvider, useAuth } from './context/AuthContext';
export { default as AuthPage } from './components/auth/AuthPage';
export { default as AdminUsers } from './components/admin/AdminUsers';
export { default as UserMenu } from './components/shared/UserMenu';
export { ToastContainer } from './components/shared/Toast';
export {
  PrivateRoute, RequireAuth, RequirePermission, RoleGate, Can, AccessDenied,
} from './components/auth/Guards';
export {
  ROLES, ROLE_LIST, PERMISSIONS, ROLE_PERMISSIONS, ACCESS_MATRIX, can,
} from './services/authConstants';
export { tokenStore, usersAPI, changeMyPassword } from './services/authApi';
export { emitToast } from './hooks/useAuthHooks';
