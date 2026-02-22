import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate } from '@/lib/notion';
import BamboojamNav from '@/components/BamboojamNav';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

export default async function RevenuesPage({ searchParams }) {
  const role = getRole();
  const params     = await searchParams;
  const filterYear = params?.year || '';

  let revenues = [];
  try { revenues = await queryDB(getDB('revenues'), null, [{property:'Date',direction:'descending'}]); } catch(e){}

  const allRev = revenues.map(r => ({
    desc:   getTitle(r),
    amount: getNumber(r,'Amount')||0,
    date:   getDate(r,'Date'),
    period: getSelect(r,'Period')||'',
  }));

  const filtered = filterYear ? allRev.filter(r=>r.period===filterYear) : allRev;
  const total    = filtered.reduce((s,r)=>s+r.amount,0);
  const years    = [...new Set(allRev.map(r=>r.period).filter(Boolean))].sort().reverse();

  // Monthly breakdown for chart
  const monthly={};
  filtered.forEach(r=>{ const m=r.date?r.date.slice(0,7):'Unknown'; monthly[m]=(monthly[m]||0)+r.amount; });
  const monthlySorted=Object.entries(monthly).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12);
  const maxMonth=Math.max(...monthlySorted.map(([,v])=>v),1);

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">📈 Revenues</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>{filtered.length} entries{filterYear?` · ${filterYear}`:''}</p>
          </div>
          <div className="rounded-lg px-4 py-2" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <span className="text-xs" style={{color:'#64748b'}}>Total</span>
            <p className="text-lg font-bold text-emerald-400 font-mono">{fmt(total)}</p>
          </div>
        </div>

        {/* Year filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <a href="/revenues" className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={!filterYear?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
            All Time
          </a>
          {years.map(y=>(
            <a key={y} href={`/revenues?year=${y}`} className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={filterYear===y?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
              {y}
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Chart */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h3 className="text-sm font-semibold text-white">Monthly Revenue</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {monthlySorted.map(([m,amt])=>(
                <div key={m}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{color:'#94a3b8'}}>{m}</span>
                    <span className="font-mono text-emerald-400">{fmt(amt)}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{background:'rgba(255,255,255,0.08)'}}>
                    <div className="h-2 rounded-full" style={{width:`${(amt/maxMonth)*100}%`,background:'linear-gradient(90deg,#34d399,#059669)'}}></div>
                  </div>
                </div>
              ))}
              {monthlySorted.length===0&&<p className="text-sm py-4" style={{color:'#64748b'}}>No data.</p>}
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <table className="w-full">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Date','Description','Period','Amount (DOP)'].map((h,i)=>(
                    <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i===3?'text-right':''}`}
                      style={{color:'#64748b'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td className="px-5 py-3 text-xs font-mono" style={{color:'#64748b'}}>{r.date||'—'}</td>
                    <td className="px-5 py-3 text-sm text-white">{r.desc||'—'}</td>
                    <td className="px-5 py-3 text-xs" style={{color:'#64748b'}}>{r.period}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold font-mono text-emerald-400">{fmt(r.amount)}</td>
                  </tr>
                ))}
                {filtered.length===0&&(
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No revenues.</td></tr>
                )}
              </tbody>
              {filtered.length>0&&(
                <tfoot>
                  <tr style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-right" style={{color:'#d4a853'}}>Total</td>
                    <td className="px-5 py-3 text-right text-sm font-bold font-mono text-emerald-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
