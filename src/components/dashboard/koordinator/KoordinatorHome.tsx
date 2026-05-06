'use client';
import React from 'react';
import Link from 'next/link';
import {
  FileText, QrCode, Users, CalendarSync,
  MapPin, LogOut
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';

export const koordinatorMenuItems = [
  { id: 1, title: 'Data Presensi', icon: FileText, href: '/koordinator/dashboard/data-presensi' },
  { id: 2, title: 'Generate QR', icon: QrCode, href: '/koordinator/dashboard/generate-qr' },
  { id: 3, title: 'Manajemen Asdos', icon: Users, href: '/koordinator/dashboard/manajemen-asdos' },
  { id: 4, title: 'Manajemen KP', icon: CalendarSync, href: '/koordinator/dashboard/manajemen-kp' },
];

const notifications = [
  {
    id: 1, name: 'Sarah Amalia', type: 'Jaringan Komputer TI C',
    detail: 'Senin, 11 Nov -> Kamis, 14 Nov', status: 'Menunggu ACC', time: '10 mnt lalu',
  },
  {
    id: 2, name: 'Doni Tata', type: 'Sistem Operasi TI A',
    detail: 'Selasa, 12 Nov -> Jumat, 15 Nov', status: 'Menunggu ACC', time: '1 jam lalu',
  },
];

const activities = [
  { id: 1, name: 'Bima Sakti', action: 'Check-in', subject: 'Basis Data - Ruang M305', time: '08:00 WIB', isCheckIn: true },
  { id: 2, name: 'Kevin Wijaya', action: 'Check-out', subject: 'Algoritma', time: '10:30 WIB', isCheckIn: false },
  { id: 3, name: 'Alya Rahma', action: 'Check-in', subject: 'Pemrograman Web - Ruang M402', time: '11:15 WIB', isCheckIn: true },
];

export default function KoordinatorHome() {
  const { user } = useUserStore();

  return (
    <>
      {/* Greeting */}
      <div className="mb-8 animate-fade-up">
        <p className="text-sm font-semibold text-[#941C2F] tracking-wide uppercase mb-1">
          Dashboard Koordinator
        </p>
        <h1 className="text-3xl font-bold text-slate-800 leading-tight">
          Halo, <br />{user?.email.split('@')[0] ?? '—'}
        </h1>
      </div>

      {/* Quick Menu */}
      <div className="flex justify-between items-start mb-10 w-full px-1">
        {koordinatorMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="flex flex-col items-center group">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-[#941C2F] group-hover:scale-105 group-active:scale-95 transition-all mb-3">
                <Icon size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 text-center w-16 leading-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Notifikasi Masuk */}
      <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-lg text-slate-800">Notifikasi Masuk</h3>
          <button className="text-xs font-semibold text-[#941C2F] active:scale-95 transition">
            Lihat Semua
          </button>
        </div>
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="bg-white p-4 rounded-2xl shadow-md active:scale-[0.97] transition-all duration-200 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-[#941C2F]/10 flex items-center justify-center text-[#941C2F] shadow-sm shrink-0">
                <CalendarSync size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-sm font-semibold text-slate-800 truncate pr-2">{notif.name}</h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.time}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-500 mb-1 truncate">{notif.type}</p>
                <p className="text-[12px] text-slate-600 mb-2 truncate">{notif.detail}</p>
                <span className="inline-block text-[10px] font-semibold text-[#941C2F] bg-[#941C2F]/15 px-3 py-1 rounded-full">
                  {notif.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aktivitas Asdos */}
      <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-lg text-slate-800">Aktivitas Asdos</h3>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3 items-start active:scale-[0.97] transition-all duration-200">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${activity.isCheckIn ? 'bg-[#941C2F]/10 text-[#941C2F]' : 'bg-slate-100 text-slate-400'}`}>
                {activity.isCheckIn ? <MapPin size={18} /> : <LogOut size={18} />}
              </div>
              <div className="flex-1 pb-3 border-b border-slate-100 last:border-none">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 leading-tight">{activity.name}</h4>
                    <p className="text-[12px] text-slate-500 leading-tight">{activity.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">{activity.time}</div>
                    <div className="text-[11px] text-slate-500">{activity.action}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
