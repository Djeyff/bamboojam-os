import { NextResponse } from 'next/server';

// BamboojamVilla OS — 3-role PIN auth
// Roles: admin (Jeff) | fred | sylvie
// Sylvie cannot access: /fredledger

const PUBLIC_PATHS = ['/login', '/api/login'];
const SYLVIE_BLOCKED = ['/fredledger'];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Always allow public paths and Next internals
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next();

  const role = req.cookies.get('bj_role')?.value;
  const adminPin = process.env.ADMIN_PIN;

  // If no ADMIN_PIN configured → open access (dev mode)
  if (!adminPin) return NextResponse.next();

  // Not logged in → redirect to login
  if (!['admin', 'fred', 'sylvie'].includes(role)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Sylvie cannot see Fred's ledger
  if (role === 'sylvie' && SYLVIE_BLOCKED.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'],
};
