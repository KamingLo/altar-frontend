interface UserData {
  id: string;
  email: string;
}

export const ProfileCard = ({ user }: { user: UserData | null }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
        Active Identity
      </h3>
      <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 rounded-3xl relative overflow-hidden">
        {/* Avatar Circle */}
        <div className="h-12 w-12 rounded-full bg-zinc-800 border-2 border-cyan-500/20 mb-4 overflow-hidden flex items-center justify-center font-bold text-cyan-500">
          {user?.email ? user.email[0].toUpperCase() : '?'}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Full Identifier</p>
            <p className="text-sm font-mono text-zinc-300 truncate">{user?.email}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Access Token Rank</p>
            <p className="text-sm font-bold text-white italic">Administrator</p>
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-[9px] text-zinc-500 font-mono break-all leading-relaxed">
              UUID: {user?.id}
            </p>
          </div>
        </div>

        {/* Status Indicator Dot */}
        <div className="absolute top-4 right-6">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};