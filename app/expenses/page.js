import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate } from '@/lib/notion';
import BamboojamNav from '@/components/BamboojamNav';

export const dynamic = 'force-dynamic';
const fmt = (n) => { const a=Math.abs(n||0); return (n<0?'-':'')+a.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}); };

const CAT_COLORS = {
  'Utilities':    '#60a5fa',
  'Cleaning':     '#34d399',
  'Maintenance':  '#fbbf24',
  'Platform Fees':'#f87171',
  'Insurance':    '#a78bfa',
  'Food/Supply':  '#fb923c',
  'Renovation':   '#e879f9',
  'Other':        '#64748b',
};

export default async function ExpensesPage({ searchParams }) {
  const params      = await searchParams;
  const filterYear  = params?.year     || '';
  const filterCat   = params?.category || '';
  const filterSrc   = params?.source   || '';

  let expenses = [];
  try { expenses = await queryDB(getDB('expenses'), null, [{property:'Date',direction:'descending'}]); } catch(e){}

  const allExp = expenses.map(e => ({
    desc:     getTitle(e),
    amount:   getNumber(e,'Amount')||0,
    date:     getDate(e,'Date'),
    category: getSelect(e,'Category')||'Other',
    source:   getSelect(e,'Source')||'Operating',
    period:   getSelect(e,'Period')||'',
  }));

  let filtered = allExp;
  if (filterYear) filtered = filtered.filter(e=>e.period===filterYear);
  if (filterCat)  filtered = filtered.filter(e=>e.category===filterCat);
  if (filterSrc)  filtered = filtered.filter(e=>e.source===filterSrc);

  const total    = filtered.reduce((s,e)=>s+e.amount,0);
  const opTotal  = filtered.filter(e=>e.source==='Operating').reduce((s,e)=>s+e.amount,0);
  const trTotal  = filtered.filter(e=>e.source==='Travaux').reduce((s,e)=>s+e.amount,0);

  const years      = [...new Set(allExp.map(e=>e.period).filter(Boolean))].sort().reverse();
  const categories = [...new Set(allExp.map(e=>e.category).filter(Boolean))].sort();

  const buildUrl = (key,val) => {
    const p = new URLSearchParams({year:filterYear,category:filterCat,source:filterSrc});
    p.set(key, p.get(key)===val?'':val);
    const str = p.toString().replace(/(&|^)(\w+=)(&|$)/g,'$1').replace(/^&|&$/g,'');
    return `/expenses?${str}`;
  };

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)'}}>
      <BamboojamNav />
      <main className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">💸 Expenses</h2>
            <p className="text-sm mt-1" style={{color:'#d4a853'}}>
              {filtered.length} entries{filterYear?` · ${filterYear}`:''}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-lg px-4 py-2" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <span className="text-xs" style={{color:'#64748b'}}>Total</span>
              <p className="text-lg font-bold text-red-400 font-mono">{fmt(total)}</p>
            </div>
            <div className="rounded-lg px-4 py-2" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <span className="text-xs" style={{color:'#64748b'}}>Operating</span>
              <p className="text-lg font-bold text-white font-mono">{fmt(opTotal)}</p>
            </div>
            <div className="rounded-lg px-4 py-2" style={{background:'rgba(167,139,250,0.06)',border:'1px solid rgba(167,139,250,0.15)'}}>
              <span className="text-xs" style={{color:'#64748b'}}>Travaux</span>
              <p className="text-lg font-bold font-mono" style={{color:'#a78bfa'}}>{fmt(trTotal)}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
          {/* Years */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide self-center mr-1" style={{color:'#64748b'}}>Year</span>
            {years.map(y=>(
              <a key={y} href={buildUrl('year',y)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                style={filterYear===y?{background:'#d4a853',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.6)'}}>
                {y}
              </a>
            ))}
          </div>
          <div className="h-5 w-px" style={{background:'rgba(255,255,255,0.08)'}}></div>
          {/* Categories */}
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide self-center mr-1" style={{color:'#64748b'}}>Cat</span>
            {categories.map(c=>(
              <a key={c} href={buildUrl('category',c)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                style={filterCat===c
                  ?{background:CAT_COLORS[c]||'#94a3b8',color:'#0f1a2e'}
                  :{background:'rgba(255,255,255,0.06)',color:CAT_COLORS[c]||'#94a3b8'}}>
                {c}
              </a>
            ))}
          </div>
          <div className="h-5 w-px" style={{background:'rgba(255,255,255,0.08)'}}></div>
          {/* Source */}
          <div className="flex gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide self-center mr-1" style={{color:'#64748b'}}>Src</span>
            {['Operating','Travaux'].map(s=>(
              <a key={s} href={buildUrl('source',s)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={filterSrc===s?{background:'#a78bfa',color:'#0f1a2e'}:{background:'rgba(255,255,255,0.06)',color:'#a78bfa'}}>
                {s}
              </a>
            ))}
          </div>
          {(filterYear||filterCat||filterSrc)&&(
            <a href="/expenses" className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{background:'rgba(248,113,113,0.12)',color:'#f87171'}}>
              ✕ Clear
            </a>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <table className="w-full">
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['Date','Description','Category','Source','Period','Amount (DOP)'].map((h,i)=>(
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i===5?'text-right':''}`}
                    style={{color:'#64748b'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e,i)=>(
                <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                  <td className="px-5 py-3 text-xs font-mono" style={{color:'#64748b'}}>{e.date||'—'}</td>
                  <td className="px-5 py-3 text-sm text-white">{e.desc}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{background:`${CAT_COLORS[e.category]||'#94a3b8'}18`,color:CAT_COLORS[e.category]||'#94a3b8'}}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium" style={{color:e.source==='Travaux'?'#a78bfa':'#64748b'}}>{e.source}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{color:'#64748b'}}>{e.period}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold font-mono text-red-400">{fmt(e.amount)}</td>
                </tr>
              ))}
              {filtered.length===0&&(
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{color:'#64748b'}}>No expenses match the selected filters.</td></tr>
              )}
            </tbody>
            {filtered.length>0&&(
              <tfoot>
                <tr style={{borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}>
                  <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-right" style={{color:'#d4a853'}}>Total</td>
                  <td className="px-5 py-3 text-right text-sm font-bold font-mono text-red-400">{fmt(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </main>
    </div>
  );
}
