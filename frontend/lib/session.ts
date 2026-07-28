export const LEGACY_AUTH_TOKEN_KEY = 'auth_token';
export const AUTH_SESSION_HINT_KEY = 'gimme_auth_session';

export function markBackendSessionPresent() {
  if (typeof window === 'undefined') return;

  localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true');
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
}

export function clearBackendSessionHints() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
}

export function hasBackendSessionHint() {
  return typeof window !== 'undefined' && localStorage.getItem(AUTH_SESSION_HINT_KEY) === 'true';
}

export function hasLegacyAuthToken() {
  return typeof window !== 'undefined' && !!localStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
}

export function getLegacyAuthToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) : null;
}
