interface HeaderProps {
  userEmail?: string;
  userId?: string;
  onLogout: () => void;
}

export const DashboardHeader = ({ userEmail, userId, onLogout }: HeaderProps) => (
  <header className="w-full border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-20">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex flex-col">
        <h2 className="text-xl font-bold">Console</h2>
        <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Operational
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-bold text-white">{userEmail}</p>
          <p className="text-[9px] text-zinc-500 font-mono">ID: {userId?.slice(0, 8)}...</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all active:scale-95"
        >
          Log Out
        </button>
      </div>
    </div>
  </header>
);