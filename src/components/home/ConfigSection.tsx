export const ConfigSection = () => (
  <section className="mt-24 w-full max-w-4xl px-6 z-10">
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
      {/* Background Icon Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L1 21h22L12 2zm0 3.45L20.14 19H3.86L12 5.45zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z"/>
        </svg>
      </div>
      
      <div className="relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Plug & Play Logic</h2>
        <p className="text-zinc-400 mb-8 max-w-xl">
          Cukup arahkan endpoint ke backend pilihan Anda. Gunakan template resmi kaming untuk integrasi otomatis tanpa konfigurasi tambahan.
        </p>

        {/* Template Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <a 
            href="https://github.com/kaminglo/express-template-msc"
            target="_blank"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <span className="text-zinc-400">Get</span> Express Template
          </a>
          <a 
            href="https://github.com/kaminglo/gin-template-msc"
            target="_blank"
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <span className="text-zinc-400">Get</span> Go-Gin Template
          </a>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black border border-zinc-800 font-mono text-sm overflow-x-auto">
            <p className="text-zinc-500"># .env</p>
            <p className="text-white">
              <span className="text-pink-500">BACKEND_URL</span>=
              <span className="text-yellow-400">&quot;http://localhost:8000&quot;</span> 
              <span className="text-zinc-500 ml-4 hidden sm:inline">&#47;&#47; Backend Template By Kaming</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 italic">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mendukung auto-parsing untuk login, registrasi, dan validasi token universal.
          </div>
        </div>
      </div>
    </div>
  </section>
);