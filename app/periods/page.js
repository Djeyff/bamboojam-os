import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate, getText } from '@/lib/notion';
import { getRole, canSeeFred } from '@/lib/auth';
import BamboojamNav from '@/components/BamboojamNav';

export const dynamic = 'force-dynamic';
const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

const SYLVIE_PCT = 0.15;
const JEFF_PCT   = 0.425;

export default async function PeriodsPage() {
  const role    = getRole();
  const showFred = canSeeFred(role);

  let periods = [];
  try { periods = await queryDB(getDB('periods'), null, [{property:'End Date',direction:'descending'}]); } catch(e){}

  const allPeriods = periods.map(p => {
    const notes    = getText(p,'Notes');
    const notesNet = notes.match(/Net Revenue: ([\d.]+)/)?.[1];
    const totalRev = getNumber(p,'Total Revenue')||0;
    const totalExp = getNumber(p,'Total Expenses')||0;
    const net      = notesNet ? parseFloat(notesNet) : (totalRev - totalExp);
    return {
      name:     getTitle(p),
      status:   getSelect(p,'Status'),
      startDate:getDate(p,'Start Date'),
      endDate:  getDate(p,'End Date'),
      totalRev, totalExp, net, notes,
      sylvie15: Math.max(0,net)*SYLVIE_PCT,
      jeff:     Math.max(0,net)*JEFF_PCT,
      fred:     Math.max(0,net)*JEFF_PCT,
    };
  });

  const statusColors = { Open:'#fbbf24', Closed:'#60a5fa', Paid:'#34d399' };
  const totalNet    = allPeriods.reduce((s,p)=>s+p.net,0);
  const totalSylvie = allPeriods.reduce((s,p)=>s+p.sylvie15,0);
  const totalJeff   = allPeriods.reduce((s,p)=>s+p.jeff,0);

  const tableHeaders = ['Period','End Date','Status','Net Revenue','Sylvie 15%','Jeff 42.5%',
    ...(showFred ? ['Fred 42.5%'] : [])];

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Period Settlements</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>{allPeriods.length} periods · Revenue split history</p>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className={`grid gap-4 mb-6 ${showFred ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
          <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">💰</span><span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>Total Net Revenue</span></div>
            <p className="text-xl font-bold font-mono text-emerald-400">{fmt(totalNet)}</p>
          </div>
          <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">🌟</span><span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>Sylvie (15%)</span></div>
            <p className="text-xl font-bold font-mono" style={{color:'#d4a853'}}>{fmt(totalSylvie)}</p>
          </div>
          <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">👑</span><span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>Jeff (42.5%)</span></div>
            <p className="text-xl font-bold font-mono text-blue-400">{fmt(totalJeff)}</p>
          </div>
          {showFred && (
            <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-center gap-2 mb-2"><span className="text-lg">🤝</span><span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>Fred (42.5%)</span></div>
              <p className="text-xl font-bold font-mono" style={{color:'#a78bfa'}}>{fmt(totalJeff)}</p>
            </div>
          )}
        </div>

        {/* Periods Table */}
        <div className="rounded-xl overflow-hidden mb-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {tableHeaders.map((h,i)=>(
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i>=3?'text-right':''}`}
                    style={{color:'#64748b'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPeriods.map((p,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    {p.notes&&<p className="text-xs mt-0.5 truncate max-w-xs" style={{color:'#64748b'}}>{p.notes}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono" style={{color:'#64748b'}}>{p.endDate||'—'}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{background:`${statusColors[p.status]||'#94a3b8'}20`,color:statusColors[p.status]||'#94a3b8'}}>
                      {p.status||'Unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold font-mono" style={{color:p.net>=0?'#34d399':'#f87171'}}>
                    {fmt(p.net)}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-mono" style={{color:'#d4a853'}}>{fmt(p.sylvie15)}</td>
                  <td className="px-5 py-4 text-right text-sm font-mono text-blue-400">{fmt(p.jeff)}</td>
                  {showFred&&<td className="px-5 py-4 text-right text-sm font-mono" style={{color:'#a78bfa'}}>{fmt(p.fred)}</td>}
                </tr>
              ))}
              {allPeriods.length===0&&(
                <tr><td colSpan={tableHeaders.length} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No periods yet.</td></tr>
              )}
            </tbody>
            {allPeriods.length>0&&(
              <tfoot>
                <tr style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-right" style={{color:'#d4a853'}}>Totals</td>
                  <td className="px-5 py-3 text-right text-sm font-bold font-mono text-emerald-400">{fmt(totalNet)}</td>
                  <td className="px-5 py-3 text-right text-sm font-bold font-mono" style={{color:'#d4a853'}}>{fmt(totalSylvie)}</td>
                  <td className="px-5 py-3 text-right text-sm font-bold font-mono text-blue-400">{fmt(totalJeff)}</td>
                  {showFred&&<td className="px-5 py-3 text-right text-sm font-bold font-mono" style={{color:'#a78bfa'}}>{fmt(totalJeff)}</td>}
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>

        {/* Visual Period Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allPeriods.map((p,i)=>{
            const sc=statusColors[p.status]||'#94a3b8';
            return (
              <div key={i} className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${sc}20`}}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ml-2 flex-shrink-0"
                    style={{background:`${sc}20`,color:sc}}>{p.status}</span>
                </div>
                <p className="text-xs mb-3" style={{color:'#64748b'}}>{p.endDate||'Open'}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{color:'#94a3b8'}}>Net Revenue</span>
                    <span className="font-mono font-semibold" style={{color:p.net>=0?'#34d399':'#f87171'}}>{fmt(p.net)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{color:'#d4a853'}}>Sylvie 15%</span>
                    <span className="font-mono" style={{color:'#d4a853'}}>{fmt(p.sylvie15)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{color:'#94a3b8'}}>Jeff (42.5%)</span>
                    <span className="font-mono text-blue-400">{fmt(p.jeff)}</span>
                  </div>
                  {showFred&&(
                    <div className="flex justify-between text-sm">
                      <span style={{color:'#94a3b8'}}>Fred (42.5%)</span>
                      <span className="font-mono" style={{color:'#a78bfa'}}>{fmt(p.fred)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
