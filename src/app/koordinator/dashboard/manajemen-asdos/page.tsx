'use client';
import React, { useState } from 'react';

export default function ManajemenAsdosPage() {
  type TabId = 'asdos' | 'koordinator' | 'user';
  type UserItem = { name: string; code: string; phone: string };

  const [activeTab, setActiveTab] = useState<'asdos' | 'koordinator' | 'user'>('asdos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk Bottom Sheet Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [selectedUserCode, setSelectedUserCode] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [modalForm, setModalForm] = useState<UserItem>({ name: '', code: '', phone: '' });
  const [deleteTarget, setDeleteTarget] = useState<{
    code: string;
    name: string;
    tab: 'asdos' | 'koordinator' | 'user';
  } | null>(null);

  const tabs: Array<{ id: TabId; label: string; short: string }> = [
    { id: 'asdos', label: 'Asisten Dosen', short: 'Asdos' },
    { id: 'koordinator', label: 'Koordinator', short: 'Koord' },
    { id: 'user', label: 'Data User', short: 'User' },
  ];
  const tabTheme: Record<TabId, { badge: string; iconBg: string; iconText: string }> = {
    asdos: { badge: 'bg-rose-50 text-[#941C2F]', iconBg: 'bg-rose-100', iconText: 'text-[#941C2F]' },
    koordinator: { badge: 'bg-indigo-50 text-indigo-700', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
    user: { badge: 'bg-emerald-50 text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
  };
  const [usersByTab, setUsersByTab] = useState<Record<TabId, UserItem[]>>({
    asdos: [
      { name: 'Sarah Amalia', code: '535200011', phone: '081234567890' },
      { name: 'Rizky Pratama', code: '535200042', phone: '081298765432' },
      { name: 'Nabila Putri', code: '535200057', phone: '085211445566' },
    ],
    koordinator: [
      { name: 'Dina Lestari', code: '198506102010122001', phone: '082211334455' },
      { name: 'Ahmad Ramadhan', code: '198207252009121003', phone: '081377889900' },
    ],
    user: [{ name: 'Akun Umum Fakultas', code: 'user-fakultas-01', phone: '-' }],
  });

  const activeUsers = usersByTab[activeTab].filter((item) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;
    return item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
  });
  const isEmptyResult = searchQuery.trim() !== '' && activeUsers.length === 0;

  const handleOpenModal = (type: 'add' | 'edit' = 'add', user?: UserItem, tabOverride?: TabId) => {
    const targetTab = tabOverride ?? activeTab;
    if (tabOverride) setActiveTab(tabOverride);
    setModalType(type);
    setSelectedUserName(user?.name ?? '');
    setSelectedUserCode(type === 'edit' ? user?.code ?? null : null);
    setModalForm(
      type === 'edit' && user
        ? { name: user.name, code: user.code, phone: user.phone }
        : { name: '', code: '', phone: '' },
    );
    setFormError('');
    setIsModalOpen(true);
    setShowQuickCreate(false);
    if (type === 'add' && targetTab === 'user') {
      setSelectedUserName('');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveUser = () => {
    const normalizedName = modalForm.name.trim();
    const normalizedCode = modalForm.code.trim();
    const normalizedPhone = modalForm.phone.trim() || '-';

    if (!normalizedName || !normalizedCode) {
      setFormError('Nama dan identitas wajib diisi.');
      return;
    }

    const isDuplicateOnCreate =
      modalType === 'add' && usersByTab[activeTab].some((item) => item.code === normalizedCode);

    const isDuplicateOnEdit =
      modalType === 'edit' &&
      usersByTab[activeTab].some((item) => item.code === normalizedCode && item.code !== selectedUserCode);

    if (isDuplicateOnCreate || isDuplicateOnEdit) {
      setFormError('Identitas sudah dipakai. Gunakan nilai lain.');
      return;
    }

    setUsersByTab((prev) => {
      if (modalType === 'edit' && selectedUserCode) {
        return {
          ...prev,
          [activeTab]: prev[activeTab].map((item) =>
            item.code === selectedUserCode
              ? { name: normalizedName, code: normalizedCode, phone: normalizedPhone }
              : item,
          ),
        };
      }

      return {
        ...prev,
        [activeTab]: [{ name: normalizedName, code: normalizedCode, phone: normalizedPhone }, ...prev[activeTab]],
      };
    });

    handleCloseModal();
  };

  const handleDeleteUser = (code: string, name: string) => {
    setDeleteTarget({ code, name, tab: activeTab });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    setUsersByTab((prev) => ({
      ...prev,
      [deleteTarget.tab]: prev[deleteTarget.tab].filter((user) => user.code !== deleteTarget.code),
    }));
    setDeleteTarget(null);
  };

  // --- Ikon SVG ---
  const SearchIcon = () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
  const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
  const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
  const PhoneIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>;
  const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;

  return (
    <div className="flex flex-col h-full pt-20 pb-28 relative w-full text-slate-800 bg-transparent overflow-x-hidden">
      
      {/* Header */}
      <div className="px-4 mb-4 relative z-10">
        <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1">Manajemen User</p>
        <h2 className="text-[28px] leading-8 font-extrabold text-[#1F2937]">Kelola Akses</h2>
        <p className="text-sm text-slate-500 mt-1">Atur data asdos, koordinator, dan user dalam satu halaman.</p>
      </div>

      {/* Tabs + Search */}
      <div className="w-full z-20 mb-3 pb-2">
        <div className="px-4">
          <div className="p-1 rounded-2xl border border-slate-200/80 bg-white/95 flex gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit px-3 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all active:scale-[0.98] ${
                activeTab === tab.id
                  ? 'bg-[#941C2F] text-white'
                  : 'bg-transparent text-slate-500'
              }`}
            >
              <span>{tab.short}</span>
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {usersByTab[tab.id].length}
              </span>
            </button>
          ))}
          </div>
        </div>

        <div className="px-4">
          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-14 py-3.5 rounded-2xl border border-slate-200/80 outline-none text-sm font-medium text-slate-800 bg-white/95 placeholder-slate-400 focus:border-[#941C2F] focus:ring-2 focus:ring-[#941C2F]/15"
              placeholder={`Cari nama atau NIM...`}
            />
            <button
              type="button"
              onClick={() => handleOpenModal('add', undefined, 'user')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#941C2F] text-white flex items-center justify-center active:scale-95"
              aria-label="Tambah user baru"
              title="Tambah user baru"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Konten Utama (Search & List) */}
      <div className="px-4 flex-1 flex flex-col space-y-3 relative z-10">
        {/* Daftar */}
        <div className="space-y-3 pb-2">
          {activeUsers.map((item) => (
              <div
                key={item.code}
                className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between border border-slate-100 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${tabTheme[activeTab].iconBg} ${tabTheme[activeTab].iconText}`}>
                    {item.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] text-[#1F2937] truncate">{item.name}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <span className="text-[10px]">#</span> {item.code}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      <PhoneIcon /> {item.phone}
                    </p>
                    <span className={`inline-flex mt-2 text-[10px] font-semibold px-2 py-1 rounded-full ${tabTheme[activeTab].badge}`}>
                      {tabs.find((tab) => tab.id === activeTab)?.label}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1 text-slate-300 shrink-0">
                  <button
                    onClick={() => handleOpenModal('edit', item)}
                    className="p-2.5 hover:text-[#941C2F] active:bg-slate-50 rounded-xl transition-colors"
                    aria-label="Edit data"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(item.code, item.name)}
                    className="p-2.5 hover:text-red-500 active:bg-slate-50 rounded-xl transition-colors"
                    aria-label="Hapus data"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}

          {isEmptyResult && (
            <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center shadow-sm">
              <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 animate-pulse">
                <UserIcon />
              </div>
              <p className="text-sm font-semibold text-slate-700">Data tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain untuk menampilkan data.</p>
            </div>
          )}
        </div>

        <div className="text-[11px] font-medium text-slate-400 px-1 pb-1">
          Menampilkan {activeUsers.length} dari {usersByTab[activeTab].length} data {tabs.find((tab) => tab.id === activeTab)?.label.toLowerCase()}.
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => handleOpenModal('add')}
        className="fixed bottom-7 right-4 w-14 h-14 bg-[#941C2F] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-800 active:scale-90 transition-transform shadow-[#941C2F]/30 z-20"
        aria-label="Tambah data baru"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
      </button>

      {/* Bottom Sheet Modal */}
      {isModalOpen && (
        <>
          {/* Overlay Gelap */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={handleCloseModal}
          ></div>

          {/* Wrapper Modal (Menggunakan fixed bottom-0 agar menempel di bawah layar HP) */}
          <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-3">
            <div className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl animate-slide-up flex flex-col max-h-[88dvh] overflow-hidden">
              <button
                type="button"
                onClick={handleCloseModal}
                className="absolute right-3 top-3 z-10 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:bg-slate-200 transition-colors"
                aria-label="Tutup modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>

              <div className="px-4 pt-5 pb-4 overflow-y-auto hide-scrollbar">
              
                {/* Header Modal */}
                <div className="mb-5">
                  <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">
                    {modalType === 'add' ? `Tambah Akun ${activeTab.toUpperCase()}` : 'Edit Akun'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {modalType === 'add'
                      ? `Masukkan data ${activeTab} baru di bawah ini.`
                      : `Perbarui data ${activeTab}${selectedUserName ? `: ${selectedUserName}` : ''}.`}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={modalForm.name}
                      onChange={(e) => setModalForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">
                      {activeTab === 'asdos' ? 'NIM / NPM' : activeTab === 'koordinator' ? 'NIP' : 'ID User / Email'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-base">#</div>
                      <input
                        type="text"
                        value={modalForm.code}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, code: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                        placeholder={activeTab === 'asdos' ? 'Contoh: 535200000' : activeTab === 'koordinator' ? 'Contoh: 1985...' : 'Contoh: user-01 / email@kampus.ac.id'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nomor Telepon / WhatsApp</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                        <PhoneIcon />
                      </div>
                      <input
                        type="tel"
                        value={modalForm.phone}
                        onChange={(e) => setModalForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-xs font-medium text-red-600 px-1">{formError}</p>
                  )}
                </form>
              </div>

              <div className="sticky bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleSaveUser}
                    className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:bg-red-900 shadow-md shadow-[#941C2F]/20"
                  >
                    {modalType === 'add' ? 'Simpan Data' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-[60]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="fixed inset-0 z-[61] flex items-center justify-center px-5">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-100">
              <p className="text-base font-bold text-slate-800">Hapus Data?</p>
              <p className="text-sm text-slate-500 mt-2">
                Apakah anda yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteTarget.name}</span>?
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="w-1/2 rounded-xl py-3 bg-slate-100 text-slate-600 font-semibold text-sm active:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 rounded-xl py-3 bg-red-600 text-white font-semibold text-sm active:bg-red-700"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}