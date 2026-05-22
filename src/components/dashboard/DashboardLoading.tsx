export const DashboardLoading = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 lg:bg-[#EDF2F4] font-['Plus_Jakarta_Sans',sans-serif]">

    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

    {/* Mobile */}
    <div className="lg:hidden relative w-full max-w-[450px] min-h-[100svh] bg-[#EDF2F4] flex flex-col items-center justify-center overflow-hidden mx-auto shadow-2xl">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#E2E8F0]"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-[#941C2F] border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.3em] animate-pulse">
          Memuat
        </p>
      </div>
    </div>

    {/* Desktop */}
    <div className="hidden lg:flex w-full h-screen overflow-hidden bg-[#EDF2F4] relative">

      {/* Sidebar skeleton */}
      <aside className="relative z-20 flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-[1.5rem] overflow-hidden shrink-0 w-[280px] bg-[#941C2F]/80 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(148,28,47,0.25)]">
        <div className="pt-8 pb-6 px-7 border-b border-white/10 shrink-0">
          <div className="h-9 w-36 bg-white/20 rounded-lg animate-pulse" />
        </div>
        <div className="flex-1 px-3 py-6 space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 rounded-xl bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="shrink-0 px-3 pb-6 pt-3 border-t border-white/10">
          <div className="h-12 rounded-xl bg-white/10 animate-pulse" />
        </div>
      </aside>

      {/* Main content area */}
      <main className="relative z-10 flex-1 h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-[#E2E8F0]"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-[#941C2F] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#64748B] text-[11px] font-bold uppercase tracking-[0.3em] animate-pulse">
            Memuat
          </p>
        </div>
      </main>
    </div>
  </div>
);