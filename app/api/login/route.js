import { NextResponse } from 'next/server';

export async function POST(req) {
  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: 'No PIN' }, { status: 400 });

  const adminPin  = process.env.ADMIN_PIN;
  const fredPin   = process.env.FRED_PIN;
  const sylviePin = process.env.SYLVIE_PIN;

  let role = null;

  if (adminPin  && pin === adminPin)  role = 'admin';
  else if (fredPin   && pin === fredPin)   role = 'fred';
  else if (sylviePin && pin === sylviePin) role = 'sylvie';

  if (!role) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role });
  // Secure, httpOnly cookie — 30 day expiry
  res.cookies.set('bj_role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('bj_role', '', { maxAge: 0, path: '/' });
  return res;
}
