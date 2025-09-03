import { useAuth } from '@/hook/useAuth';

export function AuthStatus({ className }: { className?: string }) {
  const { session, loading, error, refresh, signOut, signInDiscord } =
    useAuth();

  return (
    <div className={` bg-black/50 text-white text-xs p-2 z-20 ${className}`}>
      <div className='font-semibold'>Account</div>
      {loading ? (
        <div>Loading...</div>
      ) : session ? (
        <div className='space-y-1'>
          <div>User: {session.user?.name || session.user?.email}</div>
          <div className='flex gap-1 flex-wrap'>
            <button
              className='bg-red-600 px-2 py-1 rounded'
              onClick={signOut}
            >
              Sign Out
            </button>
            {/*
            <button
              className='bg-blue-600 px-2 py-1 rounded'
              onClick={refresh}
            >
              Refresh
            </button> */}
          </div>
        </div>
      ) : (
        <div className='space-y-1'>
          <div>Not signed in</div>
          <div className='flex gap-1 flex-wrap'>
            <button
              className='bg-indigo-600 px-2 py-1 rounded'
              onClick={signInDiscord}
            >
              Discord
            </button>
            {/* 
            <button
              className='bg-blue-600 px-2 py-1 rounded'
              onClick={refresh}
            >
              Refresh
            </button>
            */}
          </div>
        </div>
      )}
      {error && <div className='text-red-400'>{error}</div>}
    </div>
  );
}

export default AuthStatus;
