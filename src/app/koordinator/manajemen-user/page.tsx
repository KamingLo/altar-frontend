'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAsdosList, getKoorList, getUserList, getAsdosDetail,
  createUser, assignKoor, assignAsdos,
  updateAsdos, updateKoor, updateUser, deleteUser,
  activateAsdos, deactivateAsdos, activateKoor, deactivateKoor,
} from '@/lib/actions/manajemen';

import type { UserListItem } from '@/lib/actions/manajemen';
import { useManajemenStore } from '@/store/useManajemenStore';
import Image from 'next/image';
import { Plus, Search, Power } from 'lucide-react';
import { AsdosPageShell, AsdosPageHeader, AsdosState, AsdosListSkeleton, AsdosPrimaryButton } from '@/components/dashboard/asdos/AsdosUI';

type TabId = 'asdos' | 'koordinator' | 'user';
type AddStep = 'role_search' | 'create_user' | 'role_data';
type ModalType = 'add' | 'edit' | 'delete';
type AddRole = 'asdos' | 'koordinator';
type DisplayItem = { id: string; username: string; identifier: string; deactivated_at?: string | null };
type ModalForm = {
  username: string;
  email: string;
  nim: string;
  nip: string;
  phone_number: string;
};

const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PhoneIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

export default function ManajemenAsdosPage() {
  const {
    asdosList, koorList, userList,
    asdosHasMore, koorHasMore, userHasMore,
    asdosPage, koorPage, userPage,
    isLoading,
    setAsdos, setKoor, setUsers, setIsLoading,
  } = useManajemenStore();

  const [activeTab, setActiveTab] = useState<TabId>('asdos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const hasMore = activeTab === 'asdos' ? asdosHasMore : activeTab === 'koordinator' ? koorHasMore : userHasMore;
  const currentPage = activeTab === 'asdos' ? asdosPage : activeTab === 'koordinator' ? koorPage : userPage;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [modalForm, setModalForm] = useState<ModalForm>({
    username: '', email: '', nim: '', nip: '', phone_number: '',
  });

  const [sheetStartY, setSheetStartY] = useState(0);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isMd, setIsMd] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );

  const [togglePending, setTogglePending] = useState<Set<string>>(new Set());
  const [showInactive] = useState(false);

  const isFirstTabChange = useRef(true);
  const loadedTabsRef = useRef<Set<TabId>>(new Set());

  const [addStep, setAddStep] = useState<AddStep>('role_search');
  const [addRole, setAddRole] = useState<AddRole>('asdos');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<UserListItem[]>([]);
  const [isModalSearching, setIsModalSearching] = useState(false);
  const [modalSearchDone, setModalSearchDone] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [createUserForm, setCreateUserForm] = useState({ username: '', email: '' });
  const modalSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs: Array<{ id: TabId; label: string; short: string }> = [
    { id: 'asdos', label: 'Asisten Dosen', short: 'Asisten Dosen' },
    { id: 'koordinator', label: 'Koordinator', short: 'Koordinator' },
    { id: 'user', label: 'Data User', short: 'User' },
  ];

  const tabTheme: Record<TabId, { iconBg: string; iconText: string }> = {
    asdos: { iconBg: 'bg-rose-100', iconText: 'text-crimson' },
    koordinator: { iconBg: 'bg-indigo-100', iconText: 'text-indigo-700' },
    user: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-700' },
  };

  const activeItems: DisplayItem[] = (() => {
    if (activeTab === 'asdos') return asdosList.map(a => ({ id: a.id_asdos, username: a.username, identifier: a.nim, deactivated_at: a.deactivated_at }));
    if (activeTab === 'koordinator') return koorList.map(k => ({ id: k.id_koor, username: k.username, identifier: k.nip, deactivated_at: k.deactivated_at }));
    return userList.map(u => ({ id: u.id, username: u.username, identifier: u.email }));
  })();

  const loadTabData = useCallback(async (tab: TabId, search: string, page: number, append = false, inactive = false) => {
    setIsLoading(true);
    if (tab === 'asdos') {
      if (!append) setAsdos([], false, 1);
      const res = await getAsdosList(page, search, 10, inactive);
      if (res.success && res.data) {
        setAsdos(res.data, res.data.length === 10, page, append);
        if (!search && !inactive) loadedTabsRef.current.add(tab); else loadedTabsRef.current.delete(tab);
      }
    } else if (tab === 'koordinator') {
      if (!append) setKoor([], false, 1);
      const res = await getKoorList(page, search, inactive);
      if (res.success && res.data) {
        setKoor(res.data, res.data.length === 10, page, append);
        if (!search && !inactive) loadedTabsRef.current.add(tab); else loadedTabsRef.current.delete(tab);
      }
    } else {
      if (!append) setUsers([], false, 1);
      const res = await getUserList(page, search);
      if (res.success && res.data) {
        setUsers(res.data, res.data.length === 10, page, append);
        if (!search) loadedTabsRef.current.add(tab); else loadedTabsRef.current.delete(tab);
      }
    }
    setIsLoading(false);
  }, [setAsdos, setKoor, setUsers, setIsLoading]);

  useEffect(() => {
    if (loadedTabsRef.current.size > 0) return;
    const loadAll = async () => {
      setIsLoading(true);
      const [asdosRes, koorRes, userRes] = await Promise.all([
        getAsdosList(1, ''), getKoorList(1, ''), getUserList(1, ''),
      ]);
      if (asdosRes.success && asdosRes.data) { setAsdos(asdosRes.data, asdosRes.data.length === 10, 1); loadedTabsRef.current.add('asdos'); }
      if (koorRes.success && koorRes.data) { setKoor(koorRes.data, koorRes.data.length === 10, 1); loadedTabsRef.current.add('koordinator'); }
      if (userRes.success && userRes.data) { setUsers(userRes.data, userRes.data.length === 10, 1); loadedTabsRef.current.add('user'); }
      setIsLoading(false);
    };
    loadAll();
  }, [setAsdos, setKoor, setUsers, setIsLoading]);

  useEffect(() => {
    return () => { if (modalSearchTimerRef.current) clearTimeout(modalSearchTimerRef.current); };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMd(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isFirstTabChange.current) {
      isFirstTabChange.current = false;
      return;
    }

    if (!searchQuery && !showInactive && loadedTabsRef.current.has(activeTab)) return;
    const timer = setTimeout(() => {
      loadTabData(activeTab, searchQuery, 1, false, showInactive);
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, showInactive, loadTabData]);

  const handleLoadMore = () => loadTabData(activeTab, searchQuery, currentPage + 1, true, showInactive);

  const handleToggleActive = async (item: DisplayItem) => {
    const isActive = !item.deactivated_at;
    setTogglePending(prev => new Set(prev).add(item.id));
    try {
      const res = activeTab === 'asdos'
        ? isActive ? await deactivateAsdos(item.id) : await activateAsdos(item.id)
        : isActive ? await deactivateKoor(item.id) : await activateKoor(item.id);
      if (res.success) {
        loadTabData(activeTab, searchQuery, 1, false, showInactive);
      } else {
        loadTabData(activeTab, searchQuery, 1, false, showInactive);
      }
    } catch {
      // error silent
    } finally {
      setTogglePending(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  };

  const handleOpenDeleteConfirm = (item: DisplayItem) => {
    setModalType('delete');
    setSelectedId(item.id);
    setSelectedUsername(item.username);
    setFormError('');
    setIsClosing(false);
    setSheetDragY(0);
    setIsModalOpen(true);
    setTimeout(() => setIsModalVisible(true), 10);
  };

  const handleDeleteUser = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    const res = await deleteUser(selectedId);
    setIsSubmitting(false);
    if (!res.success) { setFormError(res.message || 'Gagal menghapus user.'); return; }
    handleCloseModal();
    loadTabData('user', searchQuery, 1, false, false);
  };

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

      setAddStep('role_search');
      setAddRole(activeTab === 'koordinator' ? 'koordinator' : 'asdos');
      setModalSearchQuery('');
      setModalSearchResults([]);
      setModalSearchDone(false);
      setSelectedUser(null);
      setCreateUserForm({ username: '', email: '' });
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

  const handleModalSearchChange = (value: string) => {
    setModalSearchQuery(value);
    setModalSearchDone(false);
    if (modalSearchTimerRef.current) clearTimeout(modalSearchTimerRef.current);
    if (!value.trim()) {
      setModalSearchResults([]);
      return;
    }
    modalSearchTimerRef.current = setTimeout(async () => {
      setIsModalSearching(true);
      const res = await getUserList(1, value.trim());
      setIsModalSearching(false);
      setModalSearchDone(true);
      if (res.success && res.data) setModalSearchResults(res.data);
      else setModalSearchResults([]);
    }, 400);
  };

  const handleSelectUser = (user: UserListItem) => {
    setSelectedUser(user);
    setFormError('');
    setModalForm(prev => ({ ...prev, nim: '', nip: '', phone_number: '' }));
    setAddStep('role_data');
  };

  const handleGoToCreateUser = () => {
    setCreateUserForm({ username: modalSearchQuery.trim(), email: '' });
    setFormError('');
    setAddStep('create_user');
  };

  const handleBackFromCreateUser = () => {
    setFormError('');
    setAddStep('role_search');
  };

  const handleBackFromRoleData = () => {
    setSelectedUser(null);
    setFormError('');
    setAddStep('role_search');
  };

  const handleCreateUser = async () => {
    const { username, email } = createUserForm;
    if (!username.trim() || !email.trim()) {
      setFormError('Nama lengkap dan email wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    const res = await createUser({ username: username.trim(), email: email.trim() });
    setIsSubmitting(false);
    if (!res.success) { setFormError(res.message || 'Gagal membuat user.'); return; }
    setFormError('');
    setCreateUserForm({ username: '', email: '' });
    setAddStep('role_search');
    handleModalSearchChange(email.trim());
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    const { nim, nip, phone_number } = modalForm;
    if (addRole === 'asdos') {
      if (!nim.trim() || !phone_number.trim()) { setFormError('NIM dan nomor HP wajib diisi.'); return; }
      setIsSubmitting(true);
      const res = await assignAsdos({ user_id: selectedUser.id, nim: nim.trim(), phone_number: phone_number.trim() });
      setIsSubmitting(false);
      if (!res.success) { setFormError(res.message || 'Gagal menyimpan data.'); return; }
    } else {
      if (!nip.trim()) { setFormError('NIP wajib diisi.'); return; }
      setIsSubmitting(true);
      const res = await assignKoor({ user_id: selectedUser.id, nip: nip.trim() });
      setIsSubmitting(false);
      if (!res.success) { setFormError(res.message || 'Gagal menyimpan data.'); return; }
    }
    handleCloseModal();
    loadTabData(activeTab, '', 1, false, showInactive);
  };

  const handleSave = async () => {
    if (modalType === 'add') return;
    if (!selectedId) return;
    setFormError('');
    const { username, nim, nip, phone_number } = modalForm;

    if (activeTab === 'user') {
      if (!username.trim()) { setFormError('Nama wajib diisi.'); return; }
      if (!modalForm.email.trim()) { setFormError('Email wajib diisi.'); return; }
      setIsSubmitting(true);
      const res = await updateUser(selectedId, { username: username.trim(), email: modalForm.email.trim() });
      setIsSubmitting(false);
      if (!res.success) { setFormError(res.message || 'Gagal memperbarui data.'); return; }
      handleCloseModal();
      loadTabData('user', searchQuery, 1, false, false);
      return;
    }

    if (activeTab === 'asdos' && !nim.trim()) { setFormError('NIM wajib diisi.'); return; }
    if (activeTab === 'koordinator' && !nip.trim()) { setFormError('NIP wajib diisi.'); return; }

    setIsSubmitting(true);
    const res = activeTab === 'asdos'
      ? await updateAsdos(selectedId, { nim: nim.trim(), phone_number: phone_number.trim() })
      : await updateKoor(selectedId, { nip: nip.trim() });
    setIsSubmitting(false);

    if (!res.success) { setFormError(res.message || 'Gagal memperbarui data.'); return; }
    handleCloseModal();
    loadTabData(activeTab, searchQuery, 1, false, showInactive);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => setSheetStartY(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const delta = e.touches[0].clientY - sheetStartY;
    if (delta > 0) setSheetDragY(delta);
  };
  const handleTouchEnd = () => { if (sheetDragY > 100) handleCloseModal(); else setSheetDragY(0); };

  const isEmptyResult = !isLoading && activeItems.length === 0;
  const showAddButton = activeTab !== 'user';
  const identifierLabel = activeTab === 'asdos' ? 'NIM' : activeTab === 'koordinator' ? 'NIP' : 'Email';

  return (
    <AsdosPageShell>

      <AsdosPageHeader
        eyebrow="Manajemen User"
        title="Kelola Akses"
        description="Atur data asisten dosen, koordinator, dan user dalam satu halaman."
        action={
          showAddButton ? (
            <AsdosPrimaryButton
              onClick={() => handleOpenModal('add')}
              icon={<Plus size={18} strokeWidth={2.5} />}
              className="hidden md:flex py-3.5 px-6 text-[15px] mt-4 md:mt-0"
            >
              Tambah {tabs.find(t => t.id === activeTab)?.short}
            </AsdosPrimaryButton>
          ) : undefined
        }
      />

      <div className="w-full z-20 mb-3 pb-2 md:mb-6 md:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="w-full md:w-auto">
          <div className="p-1 rounded-2xl border border-slate-200/80 bg-white/95 flex gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={`flex-1 min-w-fit px-3 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all active:scale-[0.98] ${activeTab === tab.id ? 'bg-crimson text-white' : 'bg-transparent text-slate-500'}`}
              >
                <span>{tab.short}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-1 md:w-auto md:max-w-sm shrink-0 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-[14px] md:rounded-2xl border border-slate-200 outline-none text-sm font-medium text-slate-800 bg-white placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              placeholder="Ketik nama asisten dosen, koordinator, user"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 pb-24 md:pb-12 space-y-3">
        {isLoading && activeItems.length === 0 && <AsdosListSkeleton count={4} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeItems.map((item) => {
          const isActive = !item.deactivated_at;
          const isPendingToggle = togglePending.has(item.id);
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl md:rounded-xl p-3.5 md:px-5 md:py-4 shadow-sm flex items-center justify-between border transition-all ${
                isActive ? 'border-slate-100 active:scale-[0.99] md:hover:shadow-md md:hover:border-slate-200' : 'border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl shrink-0 overflow-hidden shadow-md ${tabTheme[activeTab].iconBg}`}>
                  <Image src="/icon-512x512.png" alt="" width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[15px] md:text-base text-[#1F2937] truncate">{item.username}</h3>
                    {activeTab !== 'user' && !isActive && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-slate-600 bg-slate-100 shrink-0">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                    <span className="font-bold uppercase tracking-wider text-[10px]">{identifierLabel}</span>
                    <span className="ml-1">{item.identifier}</span>
                  </p>
                </div>
              </div>

              {activeTab !== 'user' ? (
                <div className="flex items-center gap-0.5 shrink-0 text-slate-300 md:text-slate-400">
                  <button
                    onClick={() => handleToggleActive(item)}
                    disabled={isPendingToggle}
                    className={`p-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      isActive
                        ? 'hover:text-crimson active:bg-rose-50 md:hover:bg-rose-50'
                        : 'hover:text-slate-500 active:bg-slate-50 md:hover:bg-slate-50'
                    }`}
                    aria-label={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    title={isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {isPendingToggle ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : isActive ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenModal('edit', item)}
                    className="p-2.5 hover:text-crimson active:bg-slate-50 md:hover:bg-slate-50 rounded-xl transition-colors"
                    aria-label="Edit data"
                  >
                    <EditIcon />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 shrink-0 text-slate-300 md:text-slate-400">
                  <button
                    onClick={() => handleOpenModal('edit', item)}
                    className="p-2.5 hover:text-emerald-600 rounded-xl transition-colors"
                    aria-label="Edit nama"
                    title="Edit nama"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(item)}
                    className="p-2.5 hover:text-crimson rounded-xl transition-colors"
                    aria-label="Hapus user"
                    title="Hapus user"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        </div>

        {isEmptyResult && (
          <AsdosState
            icon={<UserIcon />}
            title={searchQuery.trim() ? 'Data tidak ditemukan' : 'Belum ada data'}
            message={
              searchQuery.trim()
                ? `Tidak ada hasil untuk "${searchQuery}".`
                : activeTab !== 'user' ? 'Tekan tombol Tambah untuk menambah data baru.' : 'Belum ada user terdaftar.'
            }
          />
        )}

        {hasMore && !isLoading && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 md:py-4 text-sm font-semibold text-crimson bg-white rounded-2xl border border-slate-200/80 active:scale-[0.98] transition-transform md:hover:bg-slate-50"
          >
            Muat lebih banyak
          </button>
        )}

        {isLoading && activeItems.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-crimson/30 border-t-crimson rounded-full animate-spin" />
          </div>
        )}

        <p className="text-[11px] font-medium text-slate-400 px-1 pb-1 md:mt-2">
          Menampilkan {activeItems.length} data {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.
        </p>
      </div>

      {showAddButton && (
        <button
          onClick={() => handleOpenModal('add')}
          className="md:hidden fixed bottom-7 right-4 w-14 h-14 bg-crimson text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-800 active:scale-90 transition-transform shadow-crimson/30 z-20"
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

          {modalType === 'delete' ? (
            <>
              {/* Desktop: centered modal seperti popup keluar */}
              <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center">
                <div className={`bg-white rounded-[1.5rem] shadow-2xl w-full max-w-sm mx-4 overflow-hidden transition-all duration-300 ${isModalVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                  <div className="p-7 pb-5">
                    <h2 className="text-[20px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">Hapus User?</h2>
                    <p className="text-sm text-slate-500 text-center leading-relaxed mb-3">
                      Akun <span className="font-bold text-slate-700">{selectedUsername}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
                    </p>
                    <p className="text-xs text-crimson bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-center leading-relaxed">
                      Penghapusan dapat merusak data yang sudah ada. Pastikan ini akun baru yang datanya masih sedikit.
                    </p>
                    {formError && <p className="text-xs font-medium text-red-600 text-center mt-3">{formError}</p>}
                  </div>
                  <div className="px-6 pb-6 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl bg-crimson text-white font-bold text-sm shadow-md shadow-crimson/20 hover:bg-[#7a1727] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile: bottom sheet */}
              <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                <div
                  className="w-full max-w-md bg-white rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden pointer-events-auto"
                  style={{
                    transform: (!isModalVisible || isClosing) ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                    transition: (!isModalVisible || isClosing || sheetDragY === 0) ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
                  }}
                >
                  <div
                    className="w-full flex items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                  </div>
                  <div className="px-6 pt-4 pb-8">
                    <h2 className="text-[22px] font-extrabold text-[#1F2937] text-center leading-7 mb-2">Hapus User?</h2>
                    <p className="text-sm text-slate-500 text-center leading-relaxed mb-3">
                      Akun <span className="font-bold text-slate-700">{selectedUsername}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
                    </p>
                    <p className="text-xs text-crimson bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-center leading-relaxed mb-6">
                      Penghapusan dapat merusak data yang sudah ada. Pastikan ini akun baru yang datanya masih sedikit.
                    </p>
                    {formError && <p className="text-xs font-medium text-red-600 text-center mb-4">{formError}</p>}
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteUser}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-crimson text-white font-bold text-[15px] active:scale-[0.98] transition-all shadow-md shadow-crimson/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-full py-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] active:scale-[0.98] transition-all"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
              <div
                className={`w-full max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl flex flex-col max-h-[calc(100dvh-6rem)] md:max-h-[85vh] overflow-hidden pointer-events-auto${isMd ? ` transition-all duration-300 ${isModalVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}` : ''}`}
                style={!isMd ? {
                  transform: (!isModalVisible || isClosing) ? 'translateY(100%)' : `translateY(${sheetDragY}px)`,
                  transition: (!isModalVisible || isClosing || sheetDragY === 0) ? 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
                } : undefined}
              >
                <div
                  className="w-full flex md:hidden items-center justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

              {modalType === 'edit' ? (
                <>
                  <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto hide-scrollbar">
                    <div className="mb-5">
                      <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Edit Akun</h2>
                      <p className="text-sm text-slate-500 mt-1 font-medium">Perbarui data {selectedUsername}.</p>
                    </div>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                      {activeTab === 'user' && (
                        <>
                          <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nama Lengkap</label>
                            <input
                              type="text"
                              value={modalForm.username}
                              onChange={(e) => setModalForm(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                              placeholder="Masukkan nama lengkap"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Email</label>
                            <input
                              type="email"
                              value={modalForm.email}
                              onChange={(e) => setModalForm(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
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
                                onChange={(e) => setModalForm(prev => ({ ...prev, nim: e.target.value.replace(/[^0-9]/g, '') }))}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
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
                                <div className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">Memuat...</div>
                              ) : (
                                <input
                                  type="tel"
                                  value={modalForm.phone_number}
                                  onChange={(e) => setModalForm(prev => ({ ...prev, phone_number: e.target.value.replace(/[^0-9+\-\s()]/g, '') }))}
                                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
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
                              onChange={(e) => setModalForm(prev => ({ ...prev, nip: e.target.value.replace(/[^0-9]/g, '') }))}
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                              placeholder="Contoh: 198001012008011001"
                            />
                          </div>
                        </div>
                      )}
                      {formError && <p className="text-xs font-medium text-red-600 px-1">{formError}</p>}
                    </form>
                  </div>
                  <div className="sticky bottom-0 p-5 md:p-6 border-t border-slate-100 bg-white pb-safe md:pb-6">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSubmitting || isDetailLoading}
                      className="w-full py-3.5 rounded-xl bg-crimson text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-crimson/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </>
              ) : addStep === 'role_search' ? (
                <>
                  <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto hide-scrollbar">
                    <div className="mb-4">
                      <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Tambah Akun</h2>
                      <p className="text-sm text-slate-500 mt-1 font-medium">Pilih role lalu cari user yang sudah terdaftar.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => { setAddRole('asdos'); setModalSearchQuery(''); setModalSearchResults([]); setModalSearchDone(false); }}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-[0.97] ${addRole === 'asdos' ? 'border-crimson bg-rose-50 text-crimson' : 'border-slate-200 bg-white text-slate-500'}`}
                      >
                        Asisten Dosen
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddRole('koordinator'); setModalSearchQuery(''); setModalSearchResults([]); setModalSearchDone(false); }}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-[0.97] ${addRole === 'koordinator' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}
                      >
                        Koordinator
                      </button>
                    </div>

                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={modalSearchQuery}
                        onChange={(e) => handleModalSearchChange(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                        placeholder="Cari user berdasarkan nama atau email"
                        autoComplete="off"
                      />
                    </div>

                    {isModalSearching && (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-crimson/30 border-t-crimson rounded-full animate-spin" />
                      </div>
                    )}

                    {!isModalSearching && modalSearchResults.length > 0 && (
                      <div className="space-y-1.5">
                        {modalSearchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] transition-all text-left"
                          >
                            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 shrink-0 overflow-hidden shadow-md">
                              <Image src="/icon-512x512.png" alt="" width={36} height={36} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
                              <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </div>
                            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                          </button>
                        ))}
                      </div>
                    )}

                    {!isModalSearching && modalSearchDone && modalSearchResults.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-sm font-semibold text-slate-700">User tidak ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          {modalSearchQuery.trim() ? `"${modalSearchQuery}" belum terdaftar.` : 'Coba ketik nama atau email user.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleGoToCreateUser}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crimson text-white font-bold text-sm active:scale-[0.97] transition-transform shadow-sm shadow-crimson/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          Buat User Baru
                        </button>
                      </div>
                    )}

                    {!modalSearchQuery.trim() && !isModalSearching && (
                      <p className="text-xs text-slate-400 text-center mt-2">Ketik untuk mencari user yang sudah terdaftar.</p>
                    )}
                  </div>
                  <div className="sticky bottom-0 p-5 md:p-6 border-t border-slate-100 bg-white pb-safe md:pb-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-[15px] active:scale-[0.98] transition-transform"
                    >
                      Batal
                    </button>
                  </div>
                </>
              ) : addStep === 'create_user' ? (
                <>
                  <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto hide-scrollbar">
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        type="button"
                        onClick={handleBackFromCreateUser}
                        className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors active:scale-[0.97] shrink-0"
                        aria-label="Kembali"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">Buat User Baru</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Masukkan nama dan email untuk akun baru.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={createUserForm.username}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                          placeholder="Masukkan nama lengkap"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Email</label>
                        <input
                          type="email"
                          value={createUserForm.email}
                          onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                          placeholder="contoh@email.com"
                          autoComplete="off"
                        />
                      </div>
                      {formError && <p className="text-xs font-medium text-red-600 px-1">{formError}</p>}
                    </div>
                  </div>
                  <div className="sticky bottom-0 p-5 md:p-6 border-t border-slate-100 bg-white pb-safe md:pb-6">
                    <button
                      type="button"
                      onClick={handleCreateUser}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-crimson text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-crimson/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Membuat akun...' : 'Buat & Lanjutkan'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pt-2 md:pt-6 pb-4 overflow-y-auto hide-scrollbar">
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        type="button"
                        onClick={handleBackFromRoleData}
                        className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors active:scale-[0.97] shrink-0"
                        aria-label="Kembali"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div>
                        <h2 className="text-[20px] font-extrabold text-[#1F2937] leading-7">
                          Lengkapi Data {addRole === 'asdos' ? 'Asisten Dosen' : 'Koordinator'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Masukkan data role untuk user terpilih.</p>
                      </div>
                    </div>

                    {selectedUser && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                        <div className={`w-10 h-10 rounded-xl shrink-0 overflow-hidden shadow-md ${addRole === 'asdos' ? 'bg-rose-100' : 'bg-indigo-100'}`}>
                          <Image src="/icon-512x512.png" alt="" width={40} height={40} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{selectedUser.username}</p>
                          <p className="text-xs text-slate-400 truncate">{selectedUser.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {addRole === 'asdos' && (
                        <>
                          <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">NIM / NPM</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-base">#</div>
                              <input
                                type="text"
                                value={modalForm.nim}
                                onChange={(e) => setModalForm(prev => ({ ...prev, nim: e.target.value.replace(/[^0-9]/g, '') }))}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                                placeholder="Contoh: 535200000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">Nomor WhatsApp</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                <PhoneIcon />
                              </div>
                              <input
                                type="tel"
                                value={modalForm.phone_number}
                                onChange={(e) => setModalForm(prev => ({ ...prev, phone_number: e.target.value.replace(/[^0-9+\-\s()]/g, '') }))}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                                placeholder="Contoh: 081234567890"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      {addRole === 'koordinator' && (
                        <div>
                          <label className="block text-[13px] font-bold text-[#1F2937] mb-1.5 ml-1">NIP</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-base">#</div>
                            <input
                              type="text"
                              value={modalForm.nip}
                              onChange={(e) => setModalForm(prev => ({ ...prev, nip: e.target.value.replace(/[^0-9]/g, '') }))}
                              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-crimson focus:ring-1 focus:ring-crimson outline-none"
                              placeholder="Contoh: 198001012008011001"
                            />
                          </div>
                        </div>
                      )}
                      {formError && <p className="text-xs font-medium text-red-600 px-1">{formError}</p>}
                    </div>
                  </div>
                  <div className="sticky bottom-0 p-5 md:p-6 border-t border-slate-100 bg-white pb-safe md:pb-6">
                    <button
                      type="button"
                      onClick={handleAssignRole}
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-crimson text-white font-bold text-[15px] active:scale-[0.98] transition-transform shadow-md shadow-crimson/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
        </>
      )}

    </AsdosPageShell>
  );
}
