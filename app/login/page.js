import BamboojamLoginForm from '@/components/BamboojamLoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #0f1a2e 0%, #1a2744 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-4"
            style={{ background: 'linear-gradient(135deg, #d4a853, #c49a45)', color: '#0f1a2e' }}>
            🌴
          </div>
          <h1 className="text-2xl font-bold text-white">BamboojamVilla OS</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Las Terrenas, DR · Members only</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          <BamboojamLoginForm />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          BamboojamVilla OS · Powered by Notion
        </p>
      </div>
    </div>
  );
}
