import { getDB } from '@/lib/config';
import { queryDB, getTitle, getNumber, getSelect, getDate } from '@/lib/notion';
import BamboojamNav from '@/components/BamboojamNav';
import { getRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 75;

const fmt = (n) => {
  const a = Math.abs(n || 0);
  return (n < 0 ? '-' : '') + a.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Skip display rows that are period markers, not real expenses
const SKIP_CATEGORIES = new Set(['Period Closing', 'Year Marker']);

const CAT_COLORS = {
  // Utilities
  'Utilities – Electricity': '#60a5fa',
  'Utilities – Internet':    '#38bdf8',
  'Utilities – Gas':         '#fb923c',
  'Utilities – Water Supply':'#34d399',
  // Staff
  'Staff – Housekeeping':               '#f0abfc',
  'Staff – Security':                   '#f87171',
  'Staff – Labor':                      '#fbbf24',
  'Staff – Maintenance (Acosta)':       '#a78bfa',
  'Staff – Maintenance (Drix)':         '#a78bfa',
  'Staff – Maintenance (Bautista)':     '#a78bfa',
  'Staff – Maintenance (Wilner)':       '#a78bfa',
  'Staff – Maintenance (Esteban)':      '#a78bfa',
  'Staff – Maintenance (Virgomar)':     '#a78bfa',
  'Staff – Maintenance (Pola)':         '#a78bfa',
  // Subscriptions
  'Subscriptions – Streaming': '#e879f9',
  'Subscriptions – IPTV':      '#d946ef',
  'Subscriptions – PMS':       '#c026d3',
  'Subscriptions – Phone':     '#a21caf',
  // Maintenance
  'Maintenance – Plumbing':       '#22d3ee',
  'Maintenance – Electrical':     '#fbbf24',
  'Maintenance – Painting':       '#86efac',
  'Maintenance – Pest Control':   '#4ade80',
  'Maintenance – Appliances':     '#6ee7b7',
  'Maintenance – Security System':'#34d399',
  'Maintenance – Repairs':        '#2dd4bf',
  'Maintenance – Furniture':      '#5eead4',
  'Maintenance – Locks & Keys':   '#99f6e4',
  // Construction
  'Construction – Materials': '#f97316',
  'Construction – Hardware':  '#fb923c',
  // Equipment
  'Equipment – Electronics':    '#818cf8',
  'Equipment – Safety & Alarm': '#6366f1',
  'Equipment – Tools':          '#4f46e5',
  'Equipment – Cooling':        '#4338ca',
  'Equipment – Appliances':     '#7c3aed',
  // Household
  'Household – Equipment & Linens': '#e0f2fe',
  'Household – Linens':             '#bae6fd',
  'Household – Kitchen':            '#7dd3fc',
  'Household – Furnishings':        '#93c5fd',
  // Supplies
  'Supplies – Water (Botellones)': '#67e8f9',
  'Supplies – Groceries':          '#a7f3d0',
  'Supplies – Pool & Garden':      '#86efac',
  'Supplies – Cleaning':           '#bbf7d0',
  'Supplies – General':            '#d1fae5',
  // Other
  'Food & Hospitality': '#fdba74',
  'Guest Refunds':       '#fca5a5',
  'Transport – Fuel':    '#fcd34d',
  'Transport – Taxi':    '#fde68a',
  'Transport & Delivery':'#fef3c7',
  'Admin & Fees':        '#c7d2fe',
  'Other':               '#64748b',
};

function getCatColor(cat) {
  if (CAT_COLORS[cat]) return CAT_COLORS[cat];
  // Group fallbacks
  if (cat?.startsWith('Utilities'))     return '#60a5fa';
  if (cat?.startsWith('Staff'))         return '#a78bfa';
  if (cat?.startsWith('Subscriptions')) return '#e879f9';
  if (cat?.startsWith('Maintenance'))   return '#34d399';
  if (cat?.startsWith('Construction'))  return '#f97316';
  if (cat?.startsWith('Equipment'))     return '#818cf8';
  if (cat?.startsWith('Household'))     return '#7dd3fc';
  if (cat?.startsWith('Supplies'))      return '#86efac';
  if (cat?.startsWith('Transport'))     return '#fcd34d';
  return '#64748b';
}

export default async function ExpensesPage({ searchParams }) {
  const role   = getRole();
  const params = await searchParams;

  // ── Determine available years first (lightweight: just what we know) ──────
  // We'll use a small initial query to get the list of Period options from the DB
  // schema, or derive from a quick unfiltered fetch of just period values.
  // Actually we need to fetch once to know years. We do this smartly:
  // We fetch ALL rows but only to build filter state on first load — then we
  // restrict subsequent fetches. Use a "meta" approach: fetch one page to get years.

  let availableYears = ['2021','2022','2023','2024','2025','2026'];

  const filterYear = params?.year     || '2025'; // default to 2025 (most populated)
  const filterCat  = params?.category || '';
  const page       = parseInt(params?.page || '1');

  // ── Build Notion filter ───────────────────────────────────────────────────
  const filters = [];

  if (filterYear) {
    filters.push({ property: 'Period', select: { equals: filterYear } });
  }
  // Exclude period-closing rows always
  filters.push({ property: 'Category', select: { does_not_equal: 'Period Closing' } });
  filters.push({ property: 'Category', select: { does_not_equal: 'Year Marker' } });

  const notionFilter = filters.length === 1
    ? filters[0]
    : { and: filters };

  let rawExpenses = [];
  try {
    rawExpenses = await queryDB(
      getDB('expenses'),
      notionFilter,
      [{ property: 'Date', direction: 'ascending' }]
    );
  } catch (e) {
    console.error('Expenses fetch error:', e.message);
  }

  const allExp = rawExpenses.map(e => ({
    desc:     getTitle(e),
    amount:   getNumber(e, 'Total') || 0,   // field is "Total" not "Amount"
    date:     getDate(e, 'Date'),
    category: getSelect(e, 'Category') || 'Other',
    period:   getSelect(e, 'Period') || '',
    notes:    e?.properties?.Notes?.rich_text?.[0]?.plain_text || '',
  }));

  // Client-side category filter (fast, already small dataset)
  let filtered = allExp;
  if (filterCat) filtered = filtered.filter(e => e.category === filterCat);

  // Pagination
  const totalRows  = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Totals from ALL filtered (not just this page)
  const total       = filtered.reduce((s, e) => s + e.amount, 0);
  const avgPerEntry = filtered.length > 0 ? total / filtered.length : 0;

  // Categories present in this year
  const categories = [...new Set(allExp.map(e => e.category).filter(Boolean))].sort();

  const buildUrl = (overrides) => {
    const p = { year: filterYear, category: filterCat, page: String(page) };
    Object.assign(p, overrides);
    // Remove empty params
    Object.keys(p).forEach(k => { if (!p[k] || p[k] === '1') delete p[k]; });
    const qs = new URLSearchParams(p).toString();
    return `/expenses${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#0f1a2e 0%,#141f35 100%)' }}>
      <BamboojamNav role={role} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">💸 Expenses</h2>
            <p className="text-xs sm:text-sm mt-1" style={{ color: '#d4a853' }}>
              {filtered.length} entries
              {filterYear ? ` · ${filterYear}` : ''}
              {filterCat  ? ` · ${filterCat}` : ''}
              {totalPages > 1 ? ` · page ${page}/${totalPages}` : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="rounded-lg px-3 py-1.5 sm:px-4 sm:py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs" style={{ color: '#64748b' }}>Total</span>
              <p className="text-sm sm:text-lg font-bold text-red-400 font-mono">{fmt(total)}</p>
            </div>
            <div className="rounded-lg px-3 py-1.5 sm:px-4 sm:py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs" style={{ color: '#64748b' }}>Entries</span>
              <p className="text-sm sm:text-lg font-bold text-white font-mono">{filtered.length}</p>
            </div>
            <div className="rounded-lg px-3 py-1.5 sm:px-4 sm:py-2" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <span className="text-xs" style={{ color: '#64748b' }}>Avg/Entry</span>
              <p className="text-sm sm:text-lg font-bold font-mono" style={{ color: '#a78bfa' }}>{fmt(avgPerEntry)}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl p-3 sm:p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Year tabs */}
          <div className="flex flex-wrap gap-1.5 items-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: '#64748b' }}>Year</span>
            {availableYears.map(y => (
              <a key={y} href={buildUrl({ year: y, page: '1' })}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                style={filterYear === y
                  ? { background: '#d4a853', color: '#0f1a2e' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                {y}
              </a>
            ))}
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: '#64748b' }}>Category</span>
            {categories.map(c => {
              const color = getCatColor(c);
              return (
                <a key={c} href={buildUrl({ category: filterCat === c ? '' : c, page: '1' })}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={filterCat === c
                    ? { background: color, color: '#0f1a2e' }
                    : { background: `${color}18`, color: color }}>
                  {c}
                </a>
              );
            })}
            {filterCat && (
              <a href={buildUrl({ category: '', page: '1' })}
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                ✕ clear
              </a>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* ── Mobile Cards ── */}
          <div className="sm:hidden space-y-2 p-3">
            {pageRows.map((e, i) => {
              const color = getCatColor(e.category);
              return (
                <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-white flex-1 min-w-0 leading-snug">{e.desc}</p>
                    <span className="text-sm font-bold font-mono shrink-0 text-red-400">{fmt(e.amount)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {e.date && (
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>{e.date}</span>
                    )}
                    {e.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${color}22`, color }}>
                        {e.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {pageRows.length === 0 && (
              <p className="py-10 text-center text-sm" style={{ color: '#64748b' }}>No expenses for this filter.</p>
            )}
            {filtered.length > 0 && (
              <div className="rounded-lg p-3 mt-1" style={{ background: 'rgba(212,168,83,0.05)', border: '1px solid rgba(212,168,83,0.15)' }}>
                <div className="flex justify-between text-sm">
                  <span className="font-bold" style={{ color: '#d4a853' }}>Total {filterYear}</span>
                  <span className="font-mono font-bold text-red-400">{fmt(total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Date', 'Description', 'Category', 'Amount (DOP)'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${i === 3 ? 'text-right' : 'text-left'}`}
                      style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((e, i) => {
                  const color = getCatColor(e.category);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-2.5 text-xs font-mono whitespace-nowrap" style={{ color: '#64748b' }}>{e.date || '—'}</td>
                      <td className="px-5 py-2.5 text-sm text-white max-w-sm">
                        <span className="line-clamp-2">{e.desc}</span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: `${color}20`, color }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-sm font-semibold font-mono text-red-400 whitespace-nowrap">{fmt(e.amount)}</td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm" style={{ color: '#64748b' }}>
                      No expenses match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-right" style={{ color: '#d4a853' }}>
                      Total {filterYear}{filterCat ? ` · ${filterCat}` : ''} ({filtered.length} entries)
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold font-mono text-red-400">{fmt(total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {page > 1 && (
              <a href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                ← Prev
              </a>
            )}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Show pages around current page
                let p2;
                if (totalPages <= 7) {
                  p2 = i + 1;
                } else if (page <= 4) {
                  p2 = i + 1;
                } else if (page >= totalPages - 3) {
                  p2 = totalPages - 6 + i;
                } else {
                  p2 = page - 3 + i;
                }
                return (
                  <a key={p2} href={buildUrl({ page: String(p2) })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium"
                    style={p2 === page
                      ? { background: '#d4a853', color: '#0f1a2e' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                    {p2}
                  </a>
                );
              })}
            </div>
            {page < totalPages && (
              <a href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                Next →
              </a>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
