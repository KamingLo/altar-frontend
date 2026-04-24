interface FooterProps {
  date: string;
}

export const Footer = ({ date }: FooterProps) => (
  <footer className="mt-32 mb-20 w-full max-w-6xl px-6 border-t border-zinc-900 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 z-10">
    <div className="text-zinc-500 text-sm text-center md:text-left">
      <p className="font-bold text-zinc-300 italic">Crafted by Kaming</p>
      <p>© 2026 Auth-Next. Built for speed, scaled for production.</p>
    </div>
    <div className="flex gap-6 items-center">
      <div className="flex -space-x-2">
        <div className="h-8 w-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-bold" title="Express.js">EX</div>
        <div className="h-8 w-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-bold text-cyan-400" title="Golang Gin">GO</div>
      </div>
      <span className="h-4 w-[1px] bg-zinc-800"></span>
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{date}</span>
    </div>
  </footer>
);