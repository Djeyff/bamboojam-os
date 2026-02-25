import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate, getText } from '@/lib/notion';
import { getRole, canSeeFred } from '@/lib/auth';
import BamboojamNav from '@/components/BamboojamNav';

export const dynamic = 'force-dynamic';

const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

const SYLVIE_PCT = 0.15;
const JEFF_PCT   = 0.425;
const FRED_PCT   = 0.425;

export default async function Dashboard({ searchParams }) {
  const role = getRole();
  const showFred = canSeeFred(role);
  const params = await searchParams;
  const selectedYear = params?.year || null;

  let expenses=[], revenues=[], periods=[], sylvieLedger=[], fredLedger=[];
  try { expenses     = await queryDB(getDB('expenses'),     null, [{property:'Date',direction:'descending'}]); } catch(e){}
  try { revenues     = await queryDB(getDB('revenues'),     null, [{property:'Date',direction:'descending'}]); } catch(e){}
  try { periods      = await queryDB(getDB('periods'),      null, [{property:'End Date',direction:'descending'}]); } catch(e){}
  try { sylvieLedger = await queryDB(getDB('sylvieLedger'), null, [{property:'Date',direction:'descending'}]); } catch(e){}
  if (showFred) {
    try { fredLedger = await queryDB(getDB('fredLedger'), null, [{property:'Date',direction:'descending'}]); } catch(e){}
  }

  const allExp = expenses.map(e => ({
    desc:getTitle(e), amount:getNumber(e,'Amount')||0,
    date:getDate(e,'Date'), category:getSelect(e,'Category'),
    source:getSelect(e,'Source'), period:getSelect(e,'Period'),
  }));
  const allRev = revenues.map(r => ({
    desc:getTitle(r), amount:getNumber(r,'Amount')||0,
    date:getDate(r,'Date'), period:getSelect(r,'Period'),
  }));
  const allPeriods = periods.map(p => ({
    name:getTitle(p), status:getSelect(p,'Status'),
    endDate:getDate(p,'End Date'), startDate:getDate(p,'Start Date'),
    totalRevenue:getNumber(p,'Total Revenue')||0,
    totalExpenses:getNumber(p,'Total Expenses')||0,
    notes:getText(p,'Notes'),
  }));

  const years = [...new Set([...allExp.map(e=>e.date?.slice(0,4)),...allRev.map(r=>r.date?.slice(0,4))].filter(Boolean))].sort().reverse();
  const filteredExp = selectedYear ? allExp.filter(e=>e.date?.startsWith(selectedYear)) : allExp;
  const filteredRev = selectedYear ? allRev.filter(r=>r.date?.startsWith(selectedYear)) : allRev;

  const totalRevenue  = filteredRev.reduce((s,r)=>s+r.amount,0);
  const totalExpenses = filteredExp.reduce((s,e)=>s+e.amount,0);
  const netRevenue    = totalRevenue - totalExpenses;
  // Sylvie share comes from actual period settlements only (started 30/10/2024)
  const sylvieShare   = allPeriods.reduce((s,p)=>{
    const n = p.notes?.match(/Sylvie 15%: ([\d.]+)/);
    return s + (n ? parseFloat(n[1]) : 0);
  }, 0);
  const jeffShare     = allPeriods.reduce((s,p)=>{
    const n = p.notes?.match(/Net Revenue: ([\d.]+)/);
    const net = n ? parseFloat(n[1]) : (p.totalRevenue - p.totalExpenses);
    return s + net * JEFF_PCT;
  }, 0);
  const fredShare     = jeffShare;

  // Category breakdown
  const catTotals={};
  filteredExp.forEach(e=>{ catTotals[e.category||'Other']=(catTotals[e.category||'Other']||0)+e.amount; });
  const catSorted=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const maxCat=catSorted.length?catSorted[0][1]:1;

  // Revenue by year
  const revByYear={};
  allRev.forEach(r=>{ const y=r.date?.slice(0,4)||'Unknown'; revByYear[y]=(revByYear[y]||0)+r.amount; });
  const revYearSorted=Object.entries(revByYear).sort((a,b)=>a[0].localeCompare(b[0]));
  const maxRevYear=Math.max(...revYearSorted.map(([,v])=>v),1);

  // Sylvie ledger
  const sylvieCredits=sylvieLedger.filter(s=>getSelect(s,'Type')==='Credit').reduce((s,e)=>s+(getNumber(e,'Amount')||0),0);
  const sylvieDebits =sylvieLedger.filter(s=>getSelect(s,'Type')==='Debit').reduce((s,e)=>s+(getNumber(e,'Amount')||0),0);
  const sylvieBalance=sylvieCredits-sylvieDebits;

  const fredExpTotal =fredLedger.filter(f=>getSelect(f,'Type')==='Expense').reduce((s,e)=>s+(getNumber(e,'Amount')||0),0);
  const fredPayTotal =fredLedger.filter(f=>getSelect(f,'Type')==='Payment').reduce((s,e)=>s+(getNumber(e,'Amount')||0),0);

  const label = selectedYear ? `Year ${selectedYear}` : 'All Time';

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Header + Year Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>BamboojamVilla · {label} · Amounts in DOP</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="/" className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={!selectedYear?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
              All Time
            </a>
            {years.map(y=>(
              <a key={y} href={`/?year=${y}`} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={selectedYear===y?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
                {y}
              </a>
            ))}
          </div>
        </div>

        {/* Revenue Split Banner — role-aware */}
        <div className="rounded-xl p-5 mb-6" style={{background:'linear-gradient(135deg,rgba(212,168,83,0.1),rgba(212,168,83,0.04))',border:'1px solid rgba(212,168,83,0.2)'}}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{color:'#d4a853'}}>Revenue Split — {label}</p>
          <div className={`grid gap-4 ${showFred ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'}`}>
            <div>
              <p className="text-xs mb-1" style={{color:'#64748b'}}>Total Revenue</p>
              <p className="text-xl font-bold text-white font-mono">{fmt(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{color:'#64748b'}}>Total Expenses</p>
              <p className="text-xl font-bold text-red-400 font-mono">-{fmt(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{color:'#64748b'}}>Net Revenue</p>
              <p className={`text-xl font-bold font-mono ${netRevenue>=0?'text-emerald-400':'text-red-400'}`}>{fmt(netRevenue)}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{color:'#d4a853'}}>Sylvie (15%)</p>
              <p className="text-xl font-bold font-mono" style={{color:'#d4a853'}}>{fmt(sylvieShare)}</p>
            </div>
            {showFred ? (
              <>
                <div>
                  <p className="text-xs mb-1" style={{color:'#94a3b8'}}>Jeff = Fred (42.5%)</p>
                  <p className="text-xl font-bold font-mono text-blue-400">{fmt(jeffShare)} ea</p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs mb-1" style={{color:'#94a3b8'}}>Jeff's Share (42.5%)</p>
                <p className="text-xl font-bold font-mono text-blue-400">{fmt(jeffShare)}</p>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI icon="📈" label="Revenue Entries"  value={filteredRev.length}  sub={`${fmt(totalRevenue)} DOP`}  color="green"  />
          <KPI icon="💸" label="Expense Entries"  value={filteredExp.length}  sub={`${fmt(totalExpenses)} DOP`} color="red"    />
          <KPI icon="📊" label="Closed Periods"   value={allPeriods.filter(p=>p.status==='Closed'||p.status==='Paid').length} sub={`${allPeriods.length} total`} color="blue" />
          <KPI icon="⚖️" label="Sylvie Balance"   value={`${fmt(sylvieBalance)} DOP`} sub={`${sylvieLedger.length} entries`} color={sylvieBalance>=0?'green':'red'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Revenues */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h3 className="text-base font-semibold text-white">📈 Recent Revenues</h3>
              <a href="/revenues" className="text-xs" style={{color:'#d4a853'}}>View all →</a>
            </div>
            {filteredRev.slice(0,8).map((r,i)=>(
              <div key={i} className="px-6 py-3 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.desc||'—'}</p>
                  <p className="text-xs" style={{color:'#64748b'}}>{r.date||'—'} · <span style={{color:'#d4a853'}}>{r.date?.slice(0,4)||''}</span></p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 ml-4 font-mono">{fmt(r.amount)}</span>
              </div>
            ))}
            {filteredRev.length===0&&<p className="px-6 py-8 text-center text-sm" style={{color:'#64748b'}}>No revenues yet.</p>}
          </div>

          {/* Recent Expenses */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h3 className="text-base font-semibold text-white">💸 Recent Expenses</h3>
              <a href="/expenses" className="text-xs" style={{color:'#d4a853'}}>View all →</a>
            </div>
            {filteredExp.slice(0,8).map((e,i)=>(
              <div key={i} className="px-6 py-3 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.desc}</p>
                  <p className="text-xs" style={{color:'#64748b'}}>
                    {e.date||'—'} · <span style={{color:'#d4a853'}}>{e.category}</span>
                    {e.source==='Travaux'&&<span className="ml-1 px-1 rounded text-xs" style={{background:'rgba(167,139,250,0.15)',color:'#a78bfa'}}>travaux</span>}
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-400 ml-4 font-mono">{fmt(e.amount)}</span>
              </div>
            ))}
            {filteredExp.length===0&&<p className="px-6 py-8 text-center text-sm" style={{color:'#64748b'}}>No expenses yet.</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Expenses by Category */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h3 className="text-base font-semibold text-white">Expenses by Category <span className="text-xs font-normal" style={{color:'#64748b'}}>{label}</span></h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {catSorted.map(([cat,amt])=>(
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{color:'#94a3b8'}}>{cat}</span>
                    <span className="font-mono text-white">{fmt(amt)}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{background:'rgba(255,255,255,0.08)'}}>
                    <div className="h-2 rounded-full" style={{width:`${(amt/maxCat)*100}%`,background:'linear-gradient(90deg,#d4a853,#c49a45)'}}></div>
                  </div>
                </div>
              ))}
              {catSorted.length===0&&<p className="text-center text-sm py-4" style={{color:'#64748b'}}>No expenses.</p>}
            </div>
          </div>

          {/* Revenue by Year */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <h3 className="text-base font-semibold text-white">Revenue by Year</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {revYearSorted.map(([year,amt])=>(
                <div key={year}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{color:'#94a3b8'}}>{year}</span>
                    <span className="font-mono text-emerald-400">{fmt(amt)}</span>
                  </div>
                  <div className="w-full rounded-full h-2" style={{background:'rgba(255,255,255,0.08)'}}>
                    <div className="h-2 rounded-full" style={{width:`${(amt/maxRevYear)*100}%`,background:'linear-gradient(90deg,#34d399,#059669)'}}></div>
                  </div>
                </div>
              ))}
              {revYearSorted.length===0&&<p className="text-center text-sm py-4" style={{color:'#64748b'}}>No data.</p>}
            </div>
          </div>
        </div>

        {/* Period Settlements */}
        <div className="rounded-xl overflow-hidden mb-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <h3 className="text-base font-semibold text-white">📊 Period Settlements</h3>
            <a href="/periods" className="text-xs" style={{color:'#d4a853'}}>View all →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Period','End Date','Status','Net Revenue','Sylvie 15%',
                    ...(showFred?['Jeff 42.5%','Fred 42.5%']:['Jeff 42.5%'])
                  ].map(h=>(
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{color:'#64748b'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPeriods.slice(0,6).map((p,i)=>{
                  const notesNet=p.notes.match(/Net Revenue: ([\d.]+)/)?.[1];
                  const net=notesNet?parseFloat(notesNet):(p.totalRevenue-p.totalExpenses);
                  const s15=net*SYLVIE_PCT, jf=net*JEFF_PCT;
                  const sc={'Open':'#fbbf24','Closed':'#60a5fa','Paid':'#34d399'};
                  return (
                    <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                      <td className="px-6 py-3 text-sm font-medium text-white">{p.name}</td>
                      <td className="px-6 py-3 text-xs" style={{color:'#64748b'}}>{p.endDate||'—'}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{background:`${sc[p.status]||'#94a3b8'}20`,color:sc[p.status]||'#94a3b8'}}>
                          {p.status||'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono font-semibold" style={{color:net>=0?'#34d399':'#f87171'}}>{fmt(net)}</td>
                      <td className="px-6 py-3 text-sm font-mono" style={{color:'#d4a853'}}>{fmt(s15)}</td>
                      <td className="px-6 py-3 text-sm font-mono text-blue-400">{fmt(jf)}</td>
                      {showFred&&<td className="px-6 py-3 text-sm font-mono" style={{color:'#a78bfa'}}>{fmt(jf)}</td>}
                    </tr>
                  );
                })}
                {allPeriods.length===0&&(
                  <tr><td colSpan={showFred?7:6} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No periods yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger Cards */}
        <div className={`grid grid-cols-1 gap-6 mb-8 ${showFred ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'}`}>
          {/* Sylvie */}
          <div className="rounded-xl overflow-hidden" style={{background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.12)'}}>
            <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(52,211,153,0.1)'}}>
              <h3 className="text-base font-semibold text-emerald-400">🌟 Sylvie Ledger</h3>
              <a href="/sylvieledger" className="text-xs" style={{color:'#d4a853'}}>View all →</a>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{color:'#64748b'}}>Current Balance</span>
                <span className={`text-2xl font-bold font-mono ${sylvieBalance>=0?'text-emerald-400':'text-red-400'}`}>
                  {sylvieBalance>=0?'+':''}{fmt(sylvieBalance)} DOP
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg p-3" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.1)'}}>
                  <p style={{color:'#94a3b8'}}>Credits (owed)</p>
                  <p className="font-mono font-semibold text-emerald-400 mt-1">{fmt(sylvieCredits)}</p>
                </div>
                <div className="rounded-lg p-3" style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.1)'}}>
                  <p style={{color:'#94a3b8'}}>Debits (paid)</p>
                  <p className="font-mono font-semibold text-red-400 mt-1">{fmt(sylvieDebits)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fred — only for admin + fred */}
          {showFred && (
            <div className="rounded-xl overflow-hidden" style={{background:'rgba(96,165,250,0.04)',border:'1px solid rgba(96,165,250,0.12)'}}>
              <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(96,165,250,0.1)'}}>
                <h3 className="text-base font-semibold text-blue-400">🤝 Fred Ledger</h3>
                <a href="/fredledger" className="text-xs" style={{color:'#d4a853'}}>View all →</a>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm" style={{color:'#64748b'}}>Tracked Deductions</span>
                  <span className="text-2xl font-bold font-mono text-blue-400">{fmt(fredExpTotal)} DOP</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg p-3" style={{background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.1)'}}>
                    <p style={{color:'#94a3b8'}}>Deductions from share</p>
                    <p className="font-mono font-semibold text-blue-400 mt-1">{fmt(fredExpTotal)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.1)'}}>
                    <p style={{color:'#94a3b8'}}>Payments settled</p>
                    <p className="font-mono font-semibold text-purple-400 mt-1">{fmt(fredPayTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
      <footer className="mt-8 py-6 text-center text-xs" style={{borderTop:'1px solid rgba(212,168,83,0.1)',color:'#64748b'}}>
        Powered by <strong style={{color:'#d4a853'}}>BamboojamVilla OS</strong> · Las Terrenas, DR
      </footer>
    </div>
  );
}

function KPI({ icon, label, value, color, sub }) {
  const colors = { red:'text-red-400', green:'text-emerald-400', blue:'text-blue-400', purple:'text-purple-400' };
  return (
    <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{color:'#94a3b8'}}>{label}</span>
      </div>
      <p className={`text-xl font-bold ${colors[color]||''}`} style={color==='gold'?{color:'#d4a853'}:{}}>{value}</p>
      {sub&&<p className="text-xs mt-1" style={{color:'#64748b'}}>{sub}</p>}
    </div>
  );
}
