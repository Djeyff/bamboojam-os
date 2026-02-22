// Shared KPI card component
export default function KPI({ icon, label, value, sub, color = 'gold' }) {
  const colorMap = {
    gold:  '#d4a853',
    green: '#34d399',
    red:   '#f87171',
    blue:  '#60a5fa',
    purple:'#a78bfa',
  };
  const textColor = colorMap[color] || colorMap.gold;

  return (
    <div className="rounded-xl p-5" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94a3b8' }}>{label}</span>
      </div>
      <p className="text-xl font-bold font-mono" style={{ color: textColor }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#64748b' }}>{sub}</p>}
    </div>
  );
}
