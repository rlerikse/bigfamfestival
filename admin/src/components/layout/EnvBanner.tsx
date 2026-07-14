import { useAuth } from '@/hooks/useAuth';
import { ENV, FIREBASE_PROJECT_ID } from '@/lib/constants';
import { AlertTriangle, Code2 } from 'lucide-react';

export function EnvBanner() {
  const { user } = useAuth();

  if (ENV === 'unknown') {
    return (
      <div className="h-[34px] w-full bg-red-600 text-white flex items-center justify-center text-sm font-medium gap-2 shrink-0 sticky top-0 z-30">
        <AlertTriangle className="h-4 w-4" />
        UNKNOWN ENVIRONMENT — Configuration error
      </div>
    );
  }

  const isProd = ENV === 'production';

  if (isProd) {
    return (
      <div
        className="h-[34px] w-full text-white flex items-center justify-center text-sm font-medium gap-2 shrink-0 sticky top-0 z-30"
        style={{
          background:
            'repeating-linear-gradient(135deg,#b42318,#b42318 12px,#a01a10 12px,#a01a10 24px)',
        }}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <AlertTriangle className="h-4 w-4" />
        <span className="font-bold uppercase">⚠ PRODUCTION</span>
        <span>·</span>
        <span className="font-mono text-xs opacity-90">{FIREBASE_PROJECT_ID}</span>
        {user && (
          <>
            <span>·</span>
            <span className="text-xs opacity-90">{user.email}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-[34px] w-full bg-[#2f3a44] text-slate-300 flex items-center justify-center text-sm font-medium gap-2 shrink-0 sticky top-0 z-30">
      <Code2 className="h-4 w-4" />
      <span className="font-bold uppercase">DEV</span>
      <span>·</span>
      <span className="font-mono text-xs opacity-90">{FIREBASE_PROJECT_ID}</span>
      {user && (
        <>
          <span>·</span>
          <span className="text-xs opacity-90">{user.email}</span>
        </>
      )}
    </div>
  );
}
