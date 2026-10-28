/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Bell, Settings, FileSpreadsheet, WifiOff, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenSettings,
  onOpenExport,
}) => {
  const { state, isOnline, resetDemoData } = useApp();
  const unreadAlerts = state.alerts.length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#D5DED3] shadow-2xs">
      {/* Offline banner (FR-PWA-04) */}
      {!isOnline && (
        <div className="bg-[#F2B632] text-[#1B2B22] px-4 py-1.5 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WifiOff size={14} />
            <span>Sedang offline. Catatan disimpan di HP dan akan dikirim saat online.</span>
          </div>
          {state.offlineQueue.length > 0 && (
            <span className="bg-[#1B2B22] text-[#F2B632] px-2 py-0.5 rounded-full text-[10px]">
              {state.offlineQueue.length} antrean
            </span>
          )}
        </div>
      )}

      {/* Demo mode top banner */}
      {state.settings.isDemoMode && (
        <div className="bg-[#FFF4D6] border-b border-[#F2B632]/50 text-[#8A5A00] px-4 py-1 text-[11px] font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-[#8A5A00]" />
            <span>Mode Data Contoh Aktif</span>
          </div>
          <button
            onClick={resetDemoData}
            className="hover:underline flex items-center gap-1 font-bold text-[#8A5A00]"
          >
            <RefreshCw size={10} /> Setel Ulang
          </button>
        </div>
      )}

      {/* Main Top Bar (56px) */}
      <div className="max-w-3xl mx-auto h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1E6B47] text-white flex items-center justify-center font-black text-sm shadow-2xs">
            KP
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1B2B22] leading-tight line-clamp-1">
              {state.settings.farmName || 'Kandang Pintar'}
            </h1>
            <span className="text-[10px] font-semibold text-[#1E6B47] uppercase tracking-wider block">
              Manajemen Peternakan Ayam
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenExport}
            aria-label="Ekspor Laporan Excel"
            className="p-2 rounded-xl text-[#4F5B52] hover:bg-[#F1F5EF] hover:text-[#1B2B22] transition-colors"
          >
            <FileSpreadsheet size={20} />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Buka Notifikasi dan Peringatan"
            className="relative p-2 rounded-xl text-[#4F5B52] hover:bg-[#F1F5EF] hover:text-[#1B2B22] transition-colors"
          >
            <Bell size={20} />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#B3261E] text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadAlerts}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Pengaturan Peternakan"
            className="p-2 rounded-xl text-[#4F5B52] hover:bg-[#F1F5EF] hover:text-[#1B2B22] transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
