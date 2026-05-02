export const DashboardLoading = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-gray-200 font-['Plus_Jakarta_Sans',sans-serif]">

    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

    <div className="relative w-full max-w-[450px] min-h-[100svh] sm:min-h-screen bg-[#EDF2F4] flex flex-col items-center justify-center overflow-hidden mx-auto shadow-2xl">

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
  </div>
);