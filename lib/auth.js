// Server-side role helpers (use in page.js server components)
import { cookies } from 'next/headers';

export function getRole() {
  // In dev (no ADMIN_PIN set), return 'admin'
  if (!process.env.ADMIN_PIN) return 'admin';
  const cookieStore = cookies();
  return cookieStore.get('bj_role')?.value || null;
}

export function isAdmin(role) { return role === 'admin'; }
export function isFred(role)  { return role === 'fred';  }
export function isSylvie(role){ return role === 'sylvie';}

// Sylvie cannot see Fred's ledger OR Fred's share breakdown
export function canSeeFred(role) { return role === 'admin' || role === 'fred'; }
