import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate, getText } from '@/lib/notion';
import BamboojamNav from '@/components/BamboojamNav';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

export default async function SylvieLedgerPage() {
  const role = getRole();
  let entries = [];
  try { entries = await queryDB(getDB('sylvieLedger'), null, [{property:'Date',direction:'ascending'}]); } catch(e){}

  const allEntries = entries.map(e => ({
    desc:   getTitle(e),
    amount: getNumber(e,'Amount')||0,
    date:   getDate(e,'Date'),
    type:   getSelect(e,'Type')||'Credit',
    notes:  getText(e,'Notes'),
  }));

  // Running balance
  let running = 0;
  const withBalance = allEntries.map(e => {
    if (e.type==='Credit')  running += e.amount;
    else                     running -= e.amount;
    return { ...e, balance: running };
  }).reverse(); // Show newest first

  const totalCredits = allEntries.filter(e=>e.type==='Credit').reduce((s,e)=>s+e.amount,0);
  const totalDebits  = allEntries.filter(e=>e.type==='Debit').reduce((s,e)=>s+e.amount,0);
  const netBalance   = totalCredits - totalDebits;

  const typeColor = { Credit:'#34d399', Debit:'#f87171', Payment:'#60a5fa' };
  const typeBg    = { Credit:'rgba(52,211,153,0.12)', Debit:'rgba(248,113,113,0.12)', Payment:'rgba(96,165,250,0.12)' };

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">👤 Sylvie Ledger</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>Personal account · Hors des comptes</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {icon:'💚', label:'Total Credits (Owed to Sylvie)', val:fmt(totalCredits), color:'text-emerald-400'},
            {icon:'❤️', label:'Total Debits (Paid to Sylvie)',  val:fmt(totalDebits),  color:'text-red-400'},
            {icon:'⚖️', label:'Net Balance',                    val:(netBalance>=0?'+':'')+fmt(netBalance), color:netBalance>=0?'text-emerald-400':'text-red-400'},
          ].map(({icon,label,val,color})=>(
            <div key={label} className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>{label}</span>
              </div>
              <p className={`text-2xl font-bold font-mono ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Balance explanation */}
        <div className="rounded-xl p-4 mb-6" style={{background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)'}}>
          <p className="text-sm" style={{color:'#d4a853'}}>
            <strong>Revenue split:</strong> Sylvie gets 15% of net revenue (Revenue − Expenses) per period.
            This ledger tracks her personal account outside the normal split — special credits, debits, and payments.
          </p>
          {netBalance>0?(
            <p className="text-sm mt-2 text-emerald-400">
              ✅ Current net balance: <strong>{fmt(netBalance)} DOP</strong> is owed <em>to</em> Sylvie.
            </p>
          ):(
            <p className="text-sm mt-2 text-red-400">
              ⚠️ Current net balance: <strong>{fmt(Math.abs(netBalance))} DOP</strong> has been paid in excess <em>to</em> Sylvie.
            </p>
          )}
        </div>

        {/* Ledger Table */}
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-base font-semibold text-white">Ledger Entries ({allEntries.length})</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['Date','Description','Type','Notes','Amount','Running Balance'].map((h,i)=>(
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i>=4?'text-right':''}`}
                    style={{color:'#64748b'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withBalance.map((e,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                  <td className="px-5 py-3 text-xs font-mono" style={{color:'#64748b'}}>{e.date||'—'}</td>
                  <td className="px-5 py-3 text-sm text-white">{e.desc}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{background:typeBg[e.type]||'rgba(148,163,184,0.12)',color:typeColor[e.type]||'#94a3b8'}}>
                      {e.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{color:'#64748b'}}>{e.notes||'—'}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold font-mono"
                    style={{color:typeColor[e.type]||'#fff'}}>
                    {e.type==='Debit'?'-':''}{fmt(e.amount)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono"
                    style={{color:e.balance>=0?'#34d399':'#f87171'}}>
                    {e.balance>=0?'+':''}{fmt(e.balance)}
                  </td>
                </tr>
              ))}
              {withBalance.length===0&&(
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No ledger entries.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}
