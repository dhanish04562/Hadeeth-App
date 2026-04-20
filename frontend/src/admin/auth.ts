// Local-only admin auth (mock-mode). NOT secure — replace with Lovable Cloud auth + roles.
const SESSION_KEY = "nuur.admin.session";
const ADMIN_EMAIL_KEY = "nuur.admin.email";
const ADMIN_PASS_KEY = "nuur.admin.pass";

// Default bootstrap credentials (change after first login).
const DEFAULT_EMAIL = "admin@nuur.app";
const DEFAULT_PASS = "nuur-admin";

function ensureBootstrap() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(ADMIN_EMAIL_KEY)) {
    localStorage.setItem(ADMIN_EMAIL_KEY, DEFAULT_EMAIL);
    localStorage.setItem(ADMIN_PASS_KEY, DEFAULT_PASS);
  }
}

export function getAdminEmail(): string {
  ensureBootstrap();
  return localStorage.getItem(ADMIN_EMAIL_KEY) || DEFAULT_EMAIL;
}

export function login(email: string, password: string): boolean {
  ensureBootstrap();
  const e = localStorage.getItem(ADMIN_EMAIL_KEY);
  const p = localStorage.getItem(ADMIN_PASS_KEY);
  if (email.trim().toLowerCase() === (e || "").toLowerCase() && password === p) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export const DEFAULT_ADMIN = { email: DEFAULT_EMAIL, password: DEFAULT_PASS };
