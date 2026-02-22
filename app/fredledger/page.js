import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate, getText } from '@/lib/notion';
import { getRole } from '@/lib/auth';
import BamboojamNav from '@/components/BamboojamNav';

export const dynamic = 'force-dynamic';
const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

export default async function FredLedgerPage({ searchParams }) {
  const role     = getRole();
  const params   = await searchParams;
  const filterType = params?.type || '';

  let entries = [];
  try { entries = await queryDB(getDB('fredLedger'), null, [{property:'Date',direction:'descending'}]); } catch(e){}

  const allEntries = entries.map(e => ({
    desc:   getTitle(e),
    amount: getNumber(e,'Amount')||0,
    date:   getDate(e,'Date'),
    type:   getSelect(e,'Type')||'Expense',
    notes:  getText(e,'Notes'),
  }));

  const filtered = filterType ? allEntries.filter(e=>e.type===filterType) : allEntries;

  // Categorize — in this ledger:
  // "Expense" = things Jeff paid on Fred's behalf (deducted from Fred's share at settlement)
  // "Settlement" = periodic settlement of Fred's share (net of any deductions)
  // "Payment" = cash paid out to Fred
  // "Advance" = advance payment to Fred before settlement
  const totalDeductions  = allEntries.filter(e=>e.type==='Expense').reduce((s,e)=>s+e.amount,0);
  const totalSettlements = allEntries.filter(e=>e.type==='Settlement').reduce((s,e)=>s+e.amount,0);
  const totalPayments    = allEntries.filter(e=>e.type==='Payment').reduce((s,e)=>s+e.amount,0);
  const totalAdvances    = allEntries.filter(e=>e.type==='Advance').reduce((s,e)=>s+e.amount,0);

  const typeColors = {
    Expense:    { bg:'rgba(248,113,113,0.12)',    text:'#f87171'  },
    Payment:    { bg:'rgba(96,165,250,0.12)',     text:'#60a5fa'  },
    Advance:    { bg:'rgba(251,191,36,0.12)',     text:'#fbbf24'  },
    Settlement: { bg:'rgba(167,139,250,0.12)',    text:'#a78bfa'  },
  };
  const types = ['Expense','Payment','Advance','Settlement'];

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">🤝 Fred Ledger</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>Fred's balance account — deductions & settlements</p>
          </div>
        </div>

        {/* Role explanation */}
        <div className="rounded-xl p-4 mb-6" style={{background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)'}}>
          <p className="text-sm" style={{color:'#d4a853'}}>
            <strong>How Fred's account works:</strong> Fred is a silent partner — he doesn't manage day-to-day operations.
            All villa management, expenses, and on-site decisions are handled by <strong>Jeff (Lord Kaan)</strong>.
            Fred receives <strong>42.5% of net revenue</strong> at each settlement period.
            Sometimes Jeff pays expenses on Fred's behalf (e.g. Framboyant condo fees, other costs) —
            these are tracked here as deductions and netted out at settlement time.
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {icon:'💸', label:'Deductions (Jeff paid for Fred)', val:fmt(totalDeductions),   color:'text-red-400'},
            {icon:'💳', label:'Payments Received',               val:fmt(totalPayments),     color:'text-blue-400'},
            {icon:'⚡', label:'Advances',                        val:fmt(totalAdvances),     color:'text-yellow-400'},
            {icon:'📋', label:'Settlements',                     val:fmt(totalSettlements),  color:'text-purple-400'},
          ].map(({icon,label,val,color})=>(
            <div key={label} className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>{label}</span>
              </div>
              <p className={`text-xl font-bold font-mono ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <a href="/fredledger" className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={!filterType?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
            All ({allEntries.length})
          </a>
          {types.map(t=>{
            const count = allEntries.filter(e=>e.type===t).length;
            const tc = typeColors[t]||{bg:'rgba(148,163,184,0.12)',text:'#94a3b8'};
            return (
              <a key={t} href={`/fredledger?type=${t}`} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={filterType===t?{background:tc.text,color:'#0f1a2e'}:{background:tc.bg,color:tc.text}}>
                {t} ({count})
              </a>
            );
          })}
        </div>

        {/* Ledger Table */}
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['Date','Description','Type','Notes','Amount (DOP)'].map((h,i)=>(
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i===4?'text-right':''}`}
                    style={{color:'#64748b'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e,i)=>{
                const tc=typeColors[e.type]||{bg:'rgba(148,163,184,0.12)',text:'#94a3b8'};
                return (
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td className="px-5 py-3 text-xs font-mono" style={{color:'#64748b'}}>{e.date||'—'}</td>
                    <td className="px-5 py-3 text-sm text-white">{e.desc}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{background:tc.bg,color:tc.text}}>{e.type}</span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{color:'#64748b'}}>{e.notes||'—'}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold font-mono" style={{color:tc.text}}>
                      {fmt(e.amount)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0&&(
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No entries.</td></tr>
              )}
            </tbody>
            {filtered.length>0&&(
              <tfoot>
                <tr style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
                  <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-right" style={{color:'#d4a853'}}>
                    Total {filterType||'All'}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold font-mono text-blue-400">
                    {fmt(filtered.reduce((s,e)=>s+e.amount,0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </main>
    </div>
  );
}
