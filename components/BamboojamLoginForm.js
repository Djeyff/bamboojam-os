'use client';
import { useState } from 'react';

const ROLES = [
  {
    id: 'admin',
    label: 'Jeff (Admin)',
    icon: '👑',
    desc: 'Full access',
    color: '#d4a853',
    bg: 'rgba(212,168,83,0.12)',
    border: 'rgba(212,168,83,0.3)',
  },
  {
    id: 'fred',
    label: 'Fred',
    icon: '🤝',
    desc: 'Partner access',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.3)',
  },
  {
    id: 'sylvie',
    label: 'Sylvie',
    icon: '🌟',
    desc: 'Partner access',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.3)',
  },
];

export default function BamboojamLoginForm() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = '/';
      } else {
        setError('Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const role = ROLES.find(r => r.id === selectedRole);

  return (
    <div>
      {/* Step 1: Select role */}
      {!selectedRole ? (
        <>
          <p className="text-sm font-medium text-center mb-5" style={{ color: '#94a3b8' }}>
            Who are you?
          </p>
          <div className="space-y-3">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setSelectedRole(r.id)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-left"
                style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                <span className="text-2xl">{r.icon}</span>
                <div>
                  <p className="text-base font-semibold text-white">{r.label}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{r.desc}</p>
                </div>
                <span className="ml-auto text-lg" style={{ color: r.color }}>→</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Step 2: Enter PIN */
        <form onSubmit={handleSubmit}>
          {/* Back + role header */}
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={() => { setSelectedRole(null); setPin(''); setError(''); }}
              className="text-sm transition-colors" style={{ color: '#64748b' }}>
              ← Back
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xl">{role?.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{role?.label}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{role?.desc}</p>
              </div>
            </div>
          </div>

          <p className="text-sm mb-3 text-center" style={{ color: '#94a3b8' }}>Enter your PIN</p>

          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="••••••"
            autoFocus
            className="w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest mb-3"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${error ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: '#fff',
              outline: 'none',
            }}
          />

          {error && (
            <p className="text-sm text-center mb-3" style={{ color: '#f87171' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full py-3 rounded-lg text-base font-bold transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${role?.color || '#d4a853'}, ${role?.color || '#d4a853'}cc)`,
              color: '#0f1a2e',
            }}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      )}
    </div>
  );
}
