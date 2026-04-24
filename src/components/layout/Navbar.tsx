export const Navbar = () => (
  <nav className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between p-6 md:px-12 md:py-8 gap-4 md:gap-0 z-20">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20">
        A
      </div>
      <span className="text-2xl font-bold">Auth-Next</span>
    </div>
    <div className="flex items-center gap-6 text-sm">
      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-cyan-400">
        v1.0 Stable
      </span>
    </div>
  </nav>
);