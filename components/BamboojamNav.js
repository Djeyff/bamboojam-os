'use client';
import { useState } from 'react';

const ALL_LINKS = [
  { href: '/',             label: 'Dashboard', icon: '📊', roles: ['admin','fred','sylvie'] },
  { href: '/expenses',     label: 'Expenses',  icon: '💸', roles: ['admin','fred','sylvie'] },
  { href: '/revenues',     label: 'Revenues',  icon: '📈', roles: ['admin','fred','sylvie'] },
  { href: '/periods',      label: 'Periods',   icon: '📊', roles: ['admin','fred','sylvie'] },
  { href: '/sylvieledger', label: 'Sylvie',    icon: '🌟', roles: ['admin','fred','sylvie'] },
  { href: '/fredledger',   label: 'Fred',      icon: '🤝', roles: ['admin','fred'] }, // Sylvie cannot see
];

const ROLE_LABELS = {
  admin:  { label: 'Jeff (Admin)', icon: '👑', color: '#d4a853' },
  fred:   { label: 'Fred',         icon: '🤝', color: '#60a5fa' },
  sylvie: { label: 'Sylvie',       icon: '🌟', color: '#34d399' },
};

export default function BamboojamNav({ role = 'admin' }) {
  const [open, setOpen] = useState(false);
  const links = ALL_LINKS.filter(l => !l.roles || l.roles.includes(role));
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.admin;

  async function handleLogout() {
    await fetch('/api/login', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <header className="sticky top-0 z-50" style={{
      background: 'linear-gradient(135deg, #0f1a2e, #1a2744)',
      borderBottom: '1px solid rgba(212,168,83,0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: 'linear-gradient(135deg, #d4a853, #c49a45)', color: '#0f1a2e' }}>
            🌴
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white leading-tight">BamboojamVilla OS</h1>
            <p className="text-xs leading-tight truncate" style={{ color: '#d4a853' }}>Las Terrenas, DR</p>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <a key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span className="text-xs">{l.icon}</span> {l.label}
            </a>
          ))}
        </nav>

        {/* Right: role badge + logout */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xs">{roleInfo.icon}</span>
            <span className="text-xs font-medium" style={{ color: roleInfo.color }}>{roleInfo.label}</span>
          </div>
          <button onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}>
            Logout
          </button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden flex flex-col gap-1.5 p-2" aria-label="Menu">
          <span className="block w-6 h-0.5 rounded transition-all"
            style={{ background: '#d4a853', transform: open ? 'rotate(45deg) translate(3px,3px)' : 'none' }}></span>
          <span className="block w-6 h-0.5 rounded transition-all"
            style={{ background: '#d4a853', opacity: open ? 0 : 1 }}></span>
          <span className="block w-6 h-0.5 rounded transition-all"
            style={{ background: '#d4a853', transform: open ? 'rotate(-45deg) translate(3px,-3px)' : 'none' }}></span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-2 gap-2 pt-3">
            {links.map(l => (
              <a key={l.href} href={l.href}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-lg">{l.icon}</span>
                <span className="text-sm font-semibold text-white">{l.label}</span>
              </a>
            ))}
          </div>
          {/* Mobile: role + logout */}
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs" style={{ color: roleInfo.color }}>
              {roleInfo.icon} Logged in as {roleInfo.label}
            </span>
            <button onClick={handleLogout} className="text-xs" style={{ color: '#64748b' }}>
              Logout →
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
