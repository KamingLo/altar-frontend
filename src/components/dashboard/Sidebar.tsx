export const Sidebar = () => (
  <nav className="fixed top-0 left-0 h-full w-20 hidden md:flex flex-col items-center py-8 border-r border-zinc-900 bg-zinc-900/20 backdrop-blur-xl z-30">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg mb-12 shadow-lg shadow-cyan-500/20">
      A
    </div>
    <div className="flex flex-col gap-8 text-zinc-500">
      <div className="p-2 text-cyan-400 bg-cyan-500/10 rounded-lg cursor-pointer">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </div>
    </div>
  </nav>
);
