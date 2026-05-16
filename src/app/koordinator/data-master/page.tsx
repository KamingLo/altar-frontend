import { Database } from 'lucide-react';

export default function DataMasterPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-[#941C2F]/10 flex items-center justify-center mb-6">
        <Database size={36} className="text-[#941C2F]" />
      </div>
      <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 mb-3">
        Data Master
      </h1>
      <p className="text-slate-400 font-medium text-sm lg:text-base max-w-sm">
        Halaman ini sedang dalam pengembangan. Fitur pengelolaan kelas, mata kuliah, ruangan, dan semester akan segera hadir.
      </p>
    </div>
  );
}
