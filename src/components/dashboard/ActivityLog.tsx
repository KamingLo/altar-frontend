export const ActivityLog = () => {
  const logs = [
    { ev: 'POST /auth/login', target: 'MSC-Express', st: '200 OK' },
    { ev: 'GET /user/profile', target: 'MSC-Gin-Go', st: '200 OK' },
    { ev: 'POST /auth/refresh', target: 'MSC-Express', st: '200 OK' },
    { ev: 'GET /system/health', target: 'Internal', st: '200 OK' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
        Recent Activity Log
      </h3>
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase text-zinc-500 font-bold">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Target Backend</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-xs">
              {logs.map((row, i) => (
                <tr key={i} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4 text-zinc-300 group-hover:text-white">{row.ev}</td>
                  <td className="px-6 py-4 text-zinc-500">{row.target}</td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                      {row.st}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};