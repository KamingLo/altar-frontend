'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAsdosList, getKoorList, getUserList, getAsdosDetail,
  createAsdosAccount, createKoorAccount,
  updateAsdos, updateKoor,
  deleteAsdos, deleteKoor,
} from '@/lib/actions/manajemen';
import type { AsdosListItem, KoorListItem, UserListItem } from '@/lib/actions/manajemen';

type TabId = 'asdos' | 'koordinator' | 'user';
type DisplayItem = { id: string; username: string; identifier: string };
type ModalForm = {
  username: string;
  email: string;
  nim: string;
  nip: string;
  phone_number: string;
};

export default function ManajemenAsdosPage() {
  const [asdosList, setAsdosList] = useState<AsdosListItem[]>([]);
  const [koorList, setKoorList] = useState<KoorListItem[]>([]);
  const [userList, setUserList] = useState<UserListItem[]>([]);

  const [activeTab, setActiveTab] = useState<TabId>('asdos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [modalForm, setModalForm] = useState<ModalForm>({
    username: '', email: '', nim: '', nip: '', phone_number: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string; tab: TabId } | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);

  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [deleteSheetStartY, setDeleteSheetStartY] = useState(0);
  const [deleteSheetDragY, setDeleteSheetDragY] = useState(0);

  const isFirstTabChange = useRef(true);

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

  const tabCount = (tabId: TabId) => {
    if (tabId === 'asdos') return asdosList.length;
    if (tabId === 'koordinator') return koorList.length;
    return userList.length;
  };

  const activeItems: DisplayItem[] = (() => {
    if (activeTab === 'asdos') return asdosList.map(a => ({ id: a.id_asdos, username: a.username, identifier: a.nim }));
    if (activeTab === 'koordinator') return koorList.map(k => ({ id: k.id_koor, username: k.username, identifier: k.nip }));
    return userList.map(u => ({ id: u.id, username: u.username, identifier: u.email }));
  })();

  const loadTabData = useCallback(async (tab: TabId, search: string, page: number, append = false) => {
    setIsLoading(true);
    if (!append) {
      if (tab === 'asdos') setAsdosList([]);
      else if (tab === 'koordinator') setKoorList([]);
      else setUserList([]);
    }
    if (tab === 'asdos') {
      const res = await getAsdosList(page, search);
      if (res.success && res.data) {
        setAsdosList(prev => append ? [...prev, ...res.data!] : res.data!);
        setHasMore(res.data.length === 10);
      }
    } else if (tab === 'koordinator') {
      const res = await getKoorList(page, search);
      if (res.success && res.data) {
        setKoorList(prev => append ? [...prev, ...res.data!] : res.data!);
        setHasMore(res.data.length === 10);
      }
    } else {
      const res = await getUserList(page, search);
      if (res.success && res.data) {
        setUserList(prev => append ? [...prev, ...res.data!] : res.data!);
        setHasMore(res.data.length === 10);
      }
    }
    setCurrentPage(page);
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      const [asdosRes, koorRes, userRes] = await Promise.all([
        getAsdosList(1, ''),
        getKoorList(1, ''),
        getUserList(1, ''),
      ]);
      if (asdosRes.success && asdosRes.data) setAsdosList(asdosRes.data);
      if (koorRes.success && koorRes.data) setKoorList(koorRes.data);
      if (userRes.success && userRes.data) setUserList(userRes.data);
      if (asdosRes.success && asdosRes.data) setHasMore(asdosRes.data.length === 10);
      setIsLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (isFirstTabChange.current) {
      isFirstTabChange.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadTabData(activeTab, searchQuery, 1);
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, loadTabData]);

  const handleLoadMore = () => loadTabData(activeTab, searchQuery, currentPage + 1, true);

  const handleOpenModal = async (type: 'add' | 'edit' = 'add', item?: DisplayItem) => {
    setModalType(type);
    setSelectedId(item?.id ?? null);
    setSelectedUsername(item?.username ?? '');
    setFormError('');
    setIsClosing(false);
    setSheetDragY(0);

    if (type === 'edit' && item) {
      if (activeTab === 'koordinator') {
        setModalForm({ username: item.username, email: '', nim: '', nip: item.identifier, phone_number: '' });
      } else if (activeTab === 'asdos') {
        setModalForm({ username: item.username, email: '', nim: item.identifier, nip: '', phone_number: '' });
      } else {
        setModalForm({ username: item.username, email: item.identifier, nim: '', nip: '', phone_number: '' });
      }
    } else {
      setModalForm({ username: '', email: '', nim: '', nip: '', phone_number: '' });
    }

    setIsModalOpen(true);
    setTimeout(() => setIsModalVisible(true), 10);

    if (type === 'edit' && item && activeTab === 'asdos') {
      setIsDetailLoading(true);
      const detail = await getAsdosDetail(item.id);
      setIsDetailLoading(false);
      if (detail.success && detail.data) {
        setModalForm(prev => ({ ...prev, phone_number: detail.data!.phone_number }));
      }
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setIsModalVisible(false);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setSheetDragY(0);
    }, 300);
  };

  const handleSave = async () => {
    setFormError('');
    const { username, email, nim, nip, phone_number } = modalForm;

    if (modalType === 'add') {
      if (!username.trim() || !email.trim()) {
        setFormError('Nama pengguna dan email wajib diisi.');
        return;
      }
      if (activeTab === 'asdos' && (!nim.trim() || !phone_number.trim())) {
        setFormError('NIM dan nomor HP wajib diisi.');
        return;
      }
      if (activeTab === 'koordinator' && !nip.trim()) {
        setFormError('NIP wajib diisi.');
        return;
      }

      setIsSubmitting(true);
      const res = activeTab === 'asdos'
        ? await createAsdosAccount({ username: username.trim(), email: email.trim(), nim: nim.trim(), phone_number: phone_number.trim() })
        : await createKoorAccount({ username: username.trim(), email: email.trim(), nip: nip.trim() });
      setIsSubmitting(false);

      if (!res.success) { setFormError(res.message || 'Gagal menyimpan data.'); return; }
      handleCloseModal();
      loadTabData(activeTab, '', 1);

    } else {
      if (!selectedId) return;
      if (activeTab === 'asdos' && !nim.trim()) { setFormError('NIM wajib diisi.'); return; }
      if (activeTab === 'koordinator' && !nip.trim()) { setFormError('NIP wajib diisi.'); return; }

      setIsSubmitting(true);
      const res = activeTab === 'asdos'
        ? await updateAsdos(selectedId, { nim: nim.trim(), phone_number: phone_number.trim() })
        : await updateKoor(selectedId, { nip: nip.trim() });
      setIsSubmitting(false);

      if (!res.success) { setFormError(res.message || 'Gagal memperbarui data.'); return; }
      handleCloseModal();
      loadTabData(activeTab, searchQuery, 1);
    }
  };

  const handleDeleteOpen = (id: string, username: string) => {
    setDeleteTarget({ id, username, tab: activeTab });
    setIsDeleteClosing(false);
    setDeleteSheetDragY(0);
    setTimeout(() => setIsDeleteModalVisible(true), 10);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteClosing(true);
    setIsDeleteModalVisible(false);
    setTimeout(() => {
      setDeleteTarget(null);
      setIsDeleteClosing(false);
      setDeleteSheetDragY(0);
    }, 300);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = deleteTarget.tab === 'asdos'
      ? await deleteAsdos(deleteTarget.id)
      : await deleteKoor(deleteTarget.id);
    handleCloseDeleteModal();
    if (res.success) loadTabData(activeTab, searchQuery, 1);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => setSheetStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };
  const handleTouchEnd = () => { if (sheetDragY > 100) handleCloseModal(); else setSheetDragY(0); };

  const handleDeleteTouchStart = (e: React.TouchEvent<HTMLDivElement>) => setDeleteSheetStartY(e.touches[0].clientY);
  const handleDeleteTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const delta = e.touches[0].clientY - deleteSheetStartY;
    if (delta > 0) setDeleteSheetDragY(delta);
  };
  const handleDeleteTouchEnd = () => { if (deleteSheetDragY > 100) handleCloseDeleteModal(); else setDeleteSheetDragY(0); };

  const SearchIcon = () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
  const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
  const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
  const PhoneIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
  const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

  const isEmptyResult = !isLoading && activeItems.length === 0;
  const showAddButton = activeTab !== 'user' && searchQuery.trim() !== '' && isEmptyResult;
  const identifierLabel = activeTab === 'asdos' ? 'NIM / NPM' : activeTab === 'koordinator' ? 'NIM' : 'Email User';

  return (
    <div className="relative w-full text-slate-800 bg-transparent md:max-w-5xl md:mx-auto md:px-6 md:pt-8 lg:px-8 lg:pt-12 min-h-screen">

      <div className="mb-4 md:mb-8 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#941C2F] tracking-[0.15em] uppercase mb-1 md:text-xs">Manajemen User</p>
          <h2 className="text-[28px] md:text-3xl leading-8 font-extrabold text-[#1F2937]">Kelola Akses</h2>
          <p className="text-sm text-slate-500 mt-1 md:text-base">Atur data asdos, koordinator, dan user dalam satu halaman.</p>
        </div>

        {showAddButton && (
          <button
            onClick={() => handleOpenModal('add')}
            className="hidden md:flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] hover:bg-red-800 active:scale-[0.98] transition-all shadow-md shadow-[#941C2F]/20 mt-4 md:mt-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Tambah {tabs.find(t => t.id === activeTab)?.short}
          </button>
        )}
      </div>

      <div className="w-full z-20 mb-3 pb-2 md:mb-6 md:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="w-full md:w-auto">
          <div className="p-1 rounded-2xl border border-slate-200/80 bg-white/95 flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={`flex-1 min-w-fit px-3 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all active:scale-[0.98] ${activeTab === tab.id ? 'bg-[#941C2F] text-white' : 'bg-transparent text-slate-500'}`}
              >
                <span>{tab.short}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {tabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-80 shrink-0">
          <div className="relative md:mt-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 outline-none text-sm font-medium text-slate-800 bg-white/95 placeholder-slate-400 focus:border-[#941C2F] focus:ring-2 focus:ring-[#941C2F]/15 transition-all"
              placeholder="Ketik nama asdos, koor, user"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 relative z-10 pb-24 md:pb-12">
        {isLoading && activeItems.length === 0 && (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl md:rounded-xl p-3.5 md:p-5 border border-slate-100 animate-pulse flex items-center gap-3">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2 md:space-y-3">
                <div className="h-4 bg-slate-100 rounded-lg w-2/5 md:w-1/4" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/3 md:w-1/6" />
                <div className="h-5 bg-slate-100 rounded-full w-24 md:w-32 mt-1 md:hidden" />
              </div>
            </div>
          ))
        )}

        {activeItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex items-center justify-between border border-slate-100 active:scale-[0.99] md:hover:shadow-md md:hover:border-slate-200 transition-all"
          >
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 md:w-1/3">
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-bold text-base md:text-lg shrink-0 ${tabTheme[activeTab].iconBg} ${tabTheme[activeTab].iconText}`}>
                {item.username[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{item.username}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 flex md:hidden items-center gap-1">
                  <span className="text-[10px]">#</span> {item.identifier}
                </p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center px-4">
              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{identifierLabel}</span>
                <span className="text-[13px] font-semibold text-slate-700">{item.identifier}</span>
              </div>
            </div>

            {activeTab !== 'user' && (
              <div className="flex space-x-1 md:space-x-2 text-slate-300 md:text-slate-400 shrink-0">
                <button
                  onClick={() => handleOpenModal('edit', item)}
                  className="p-2.5 hover:text-[#941C2F] active:bg-slate-50 md:hover:bg-slate-50 rounded-xl transition-colors"
                  aria-label="Edit data"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => handleDeleteOpen(item.id, item.username)}
                  className="p-2.5 hover:text-red-500 active:bg-slate-50 md:hover:bg-red-50 rounded-xl transition-colors"
                  aria-label="Hapus data"
                >
                  <DeleteIcon />
                </button>
              </div>
            )}
          </div>
        ))}

        {isEmptyResult && (
          <div className="bg-white rounded-2xl p-6 md:p-12 border border-dashed border-slate-200 text-center shadow-sm">
            <div className="mx-auto mb-3 md:mb-5 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <UserIcon />
            </div>
            <p className="text-sm md:text-base font-semibold text-slate-700">
              {searchQuery.trim() ? 'Data tidak ditemukan' : 'Belum ada data'}
            </p>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery.trim()
                ? activeTab !== 'user'
                  ? `"${searchQuery}" belum ada. Tekan tombol + untuk tambah.`
                  : `Tidak ada hasil untuk "${searchQuery}".`
                : activeTab !== 'user' ? 'Coba cari nama dulu untuk menambah data baru.' : 'Belum ada user terdaftar.'}
            </p>
          </div>
        )}

        {hasMore && !isLoading && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 md:py-4 text-sm font-semibold text-[#941C2F] bg-white rounded-2xl border border-slate-200/80 active:scale-[0.98] transition-transform md:hover:bg-slate-50"
          >
            Muat lebih banyak
          </button>
        )}

        {isLoading && activeItems.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#941C2F]/30 border-t-[#941C2F] rounded-full animate-spin" />
          </div>
        )}

        <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 md:mt-2">
          Menampilkan {activeItems.length} data {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.
        </p>
      </div>

      {showAddButton && (
        <button
          onClick={() => handleOpenModal('add')}
          className="md:hidden fixed bottom-7 right-4 w-14 h-14 bg-[#941C2F] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-800 active:scale-90 transition-transform shadow-[#941C2F]/30 z-20"
          aria-label="Tambah data baru"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {isModalOpen && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${isModalVisible && !isClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseModal}
          />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[90dvh] md:max-h-[85vh] overflow-hidden pointer-events-auto"
              style={{
                transform: (!isModalVisible || isClosing) ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                transition: (!isModalVisible || isClosing || sheetDragY === 0) ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
              }}
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto hide-scrollbar">
                <div className="mb-5">
                  <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">
                    {modalType === 'add' ? `Tambah ${tabs.find(t => t.id === activeTab)?.label}` : 'Edit Akun'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {modalType === 'add'
                      ? 'Masukkan data untuk membuat akun baru.'
                      : `Perbarui data ${selectedUsername}.`}
                  </p>
                </div>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  {modalType === 'add' && (
                    <>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nama Pengguna</label>
                        <input
                          type="text"
                          value={modalForm.username}
                          onChange={(e) => setModalForm(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                          placeholder="Masukkan nama pengguna"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Email</label>
                        <input
                          type="email"
                          value={modalForm.email}
                          onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                          placeholder="contoh@email.com"
                          autoComplete="off"
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'asdos' && (
                    <>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">NIM / NPM</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-base">#</div>
                          <input
                            type="text"
                            value={modalForm.nim}
                            onChange={(e) => setModalForm(prev => ({ ...prev, nim: e.target.value }))}
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                            placeholder="Contoh: 535200000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nomor HP / WhatsApp</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            <PhoneIcon />
                          </div>
                          {isDetailLoading ? (
                            <div className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
                              Memuat...
                            </div>
                          ) : (
                            <input
                              type="tel"
                              value={modalForm.phone_number}
                              onChange={(e) => setModalForm(prev => ({ ...prev, phone_number: e.target.value }))}
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                              placeholder="Contoh: 081234567890"
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'koordinator' && (
                    <div>
                      <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">NIP</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-base">#</div>
                        <input
                          type="text"
                          value={modalForm.nip}
                          onChange={(e) => setModalForm(prev => ({ ...prev, nip: e.target.value }))}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-[#941C2F] focus:ring-1 focus:ring-[#941C2F] outline-none"
                          placeholder="Contoh: 198001012008011001"
                        />
                      </div>
                    </div>
                  )}

                  {formError && (
                    <p className="text-xs font-medium text-red-600 px-1">{formError}</p>
                  )}
                </form>
              </div>

              <div className="sticky bottom-0 p-5 md:p-6 border-t border-slate-100 bg-white pb-safe md:pb-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting || isDetailLoading}
                  className="w-full py-3.5 rounded-xl bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Menyimpan...' : modalType === 'add' ? 'Simpan Data' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div
            className={`fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ease-out ${isDeleteModalVisible && !isDeleteClosing ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseDeleteModal}
          />
          <div className="fixed inset-0 z-[61] flex items-end md:items-center justify-center pointer-events-none">
            <div
              className="w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
              style={{
                transform: (!isDeleteModalVisible || isDeleteClosing) ? 'translateY(100%)' : `translateY(${deleteSheetDragY}px)`,
                transition: (!isDeleteModalVisible || isDeleteClosing || deleteSheetDragY === 0) ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
              }}
            >
              <div
                className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleDeleteTouchStart}
                onTouchMove={handleDeleteTouchMove}
                onTouchEnd={handleDeleteTouchEnd}
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              <div className="px-5 pt-2 md:pt-6 pb-6 md:pb-8">
                <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Hapus Data?</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  Apakah anda yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteTarget.username}</span>?
                </p>
                <div className="mt-6 md:mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseDeleteModal}
                    className="flex-1 rounded-xl py-3.5 bg-slate-100 text-slate-600 font-bold text-[15px] active:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 rounded-xl py-3.5 bg-[#941C2F] text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-[#941C2F]/20"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}