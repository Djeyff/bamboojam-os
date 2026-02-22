'use client';
import { useState } from 'react';

const links = [
  { href: '/',             label: 'Dashboard', icon: '📊' },
  { href: '/expenses',     label: 'Expenses',  icon: '💸' },
  { href: '/revenues',     label: 'Revenues',  icon: '📈' },
  { href: '/periods',      label: 'Periods',   icon: '📊' },
  { href: '/fredledger',   label: 'Fred',      icon: '👤' },
  { href: '/sylvieledger', label: 'Sylvie',    icon: '👤' },
];

export default function BamboojamNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50" style={{
      background: 'linear-gradient(135deg, #0f1a2e, #1a2744)',
      borderBottom: '1px solid rgba(212,168,83,0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo — mirrors ConstructionNav branding block */}
        <a href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: 'linear-gradient(135deg, #d4a853, #c49a45)', color: '#0f1a2e' }}>
            🌴
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">BamboojamVilla OS</h1>
            <p className="text-xs leading-tight" style={{ color: '#d4a853' }}>Punta Cana, DR · Rental Manager</p>
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
        </nav>
      )}
    </header>
  );
}
