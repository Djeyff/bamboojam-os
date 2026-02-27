'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOLD  = '#d4a853';
const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '0.5rem',
  color: 'white',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
};
const labelStyle = { color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600', display: 'block', marginBottom: '0.25rem' };

const EXPENSE_CATEGORIES = [
  'Utilities', 'Cleaning', 'Maintenance', 'Platform Fees', 'Food/Supply',
  'Renovation', 'Other', 'Staff – Housekeeping', 'Staff – Security',
  'Supplies – Groceries', 'Transport – Fuel', 'Equipment – Appliances',
  'Utilities – Electricity', 'Utilities – Water Supply', 'Utilities – Internet',
  'Maintenance – Repairs', 'Maintenance – Electrical', 'Maintenance – Plumbing',
  'Household – Linens', 'Household – Equipment & Linens', 'Construction – Materials',
];

const today = () => new Date().toISOString().slice(0, 10);
const thisYear = () => String(new Date().getFullYear());

export default function AddEntryModal() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [type, setType]       = useState('expense');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  const [f, setF] = useState({
    description: '', amount: '', total: '', date: today(),
    period: thisYear(), notes: '', source: 'Operating', category: '',
  });
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const reset = () => {
    setF({ description:'', amount:'', total:'', date:today(), period:thisYear(), notes:'', source:'Operating', category:'' });
    setSuccess(false); setError('');
  };

  const close = () => { setOpen(false); reset(); };

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const body = type === 'revenue'
        ? { type, description: f.description, amount: f.amount, date: f.date, period: f.period, notes: f.notes }
        : { type, description: f.description, total: f.total, date: f.date, period: f.period, source: f.source, category: f.category, notes: f.notes };

      const res  = await fetch('/api/entries', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error');
      setSuccess(true);
      setTimeout(() => { close(); router.refresh(); }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button onClick={() => setOpen(true)}
        style={{ background: GOLD, color: '#0f1a2e', fontWeight: '700', fontSize: '0.875rem', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
        + Add
      </button>

      {/* Overlay */}
      {open && (
        <div onClick={close} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#1a2740', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1rem', width:'100%', maxWidth:'480px', padding:'1.5rem', maxHeight:'90vh', overflowY:'auto' }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h3 style={{ color:'white', fontWeight:'700', fontSize:'1.1rem', margin:0 }}>Add Entry</h3>
              <button onClick={close} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            {/* Type tabs */}
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem' }}>
              {['revenue','expense'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  style={{ flex:1, padding:'0.5rem', borderRadius:'0.5rem', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.875rem',
                    background: type===t ? GOLD : 'rgba(255,255,255,0.06)', color: type===t ? '#0f1a2e' : 'rgba(255,255,255,0.6)' }}>
                  {t === 'revenue' ? '💰 Revenue' : '💸 Expense'}
                </button>
              ))}
            </div>

            {success ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'#4ade80', fontWeight:'700', fontSize:'1.1rem' }}>✅ Saved!</div>
            ) : (
              <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description *</label>
                  <input value={f.description} onChange={set('description')} required placeholder="Description..." style={inputStyle} />
                </div>

                {/* Amount */}
                <div>
                  <label style={labelStyle}>{type === 'revenue' ? 'Amount' : 'Total'} (DOP) *</label>
                  <input type="number" step="0.01" value={type==='revenue'?f.amount:f.total}
                    onChange={set(type==='revenue'?'amount':'total')} required placeholder="0.00" style={inputStyle} />
                </div>

                {/* Date + Period */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Date *</label>
                    <input type="date" value={f.date} onChange={set('date')} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Period</label>
                    <select value={f.period} onChange={set('period')} style={inputStyle}>
                      {['2026','2025','2024','2023','2022','2021','2020'].map(y=>(
                        <option key={y} value={y} style={{background:'#1a2740'}}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Expense-only fields */}
                {type === 'expense' && (
                  <>
                    <div>
                      <label style={labelStyle}>Source</label>
                      <select value={f.source} onChange={set('source')} style={inputStyle}>
                        <option value="Operating" style={{background:'#1a2740'}}>Operating</option>
                        <option value="Travaux" style={{background:'#1a2740'}}>Travaux</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select value={f.category} onChange={set('category')} style={inputStyle}>
                        <option value="" style={{background:'#1a2740'}}>— Select —</option>
                        {EXPENSE_CATEGORIES.map(c=>(
                          <option key={c} value={c} style={{background:'#1a2740'}}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={f.notes} onChange={set('notes')} placeholder="Optional notes..." rows={2}
                    style={{...inputStyle, resize:'vertical'}} />
                </div>

                {error && <p style={{ color:'#f87171', fontSize:'0.875rem', margin:0 }}>{error}</p>}

                <button type="submit" disabled={loading}
                  style={{ background: GOLD, color:'#0f1a2e', fontWeight:'700', padding:'0.75rem', borderRadius:'0.5rem', border:'none', cursor: loading?'not-allowed':'pointer', opacity: loading?0.7:1, fontSize:'0.9rem' }}>
                  {loading ? 'Saving...' : 'Save Entry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
