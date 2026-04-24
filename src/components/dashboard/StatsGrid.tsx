export const StatsGrid = () => {
  const stats = [
    { label: 'API Calls', val: '2.4k', change: '+12%', color: 'cyan' },
    { label: 'Server Load', val: '14%', change: 'Stable', color: 'emerald' },
    { label: 'Latency', val: '42ms', change: '-5ms', color: 'blue' },
    { label: 'Integrations', val: '08', change: 'Live', color: 'purple' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div 
          key={i} 
          className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors"
        >
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">
            {stat.label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">{stat.val}</h3>
            <span className="text-[10px] font-mono text-cyan-400">{stat.change}</span>
          </div>
          {/* Decorative Progress Bar on Hover */}
          <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-500"></div>
        </div>
      ))}
    </div>
  );
};