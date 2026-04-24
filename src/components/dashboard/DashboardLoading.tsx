export const DashboardLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-black">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 animate-spin shadow-lg shadow-cyan-500/20 flex items-center justify-center">
        <div className="h-8 w-8 bg-black rounded-lg"></div>
      </div>
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
        Booting_System...
      </p>
    </div>
  </div>
);