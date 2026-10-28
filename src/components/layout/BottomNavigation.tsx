/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Layers, Plus, DollarSign, MessageSquare } from 'lucide-react';

export type NavTab = 'beranda' | 'ayam' | 'keuangan' | 'asisten';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenQuickLog: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickLog,
}) => {
  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#D5DED3] pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      <div className="max-w-3xl mx-auto h-16 px-2 flex items-center justify-between">
        {/* Tab 1: Beranda */}
        <button
          type="button"
          onClick={() => onTabChange('beranda')}
          aria-label="Beranda"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'beranda'
              ? 'text-[#1E6B47] font-bold'
              : 'text-[#4F5B52] hover:text-[#1B2B22]'
          }`}
        >
          <Home size={22} className={activeTab === 'beranda' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-0.5">Beranda</span>
        </button>

        {/* Tab 2: Ayam */}
        <button
          type="button"
          onClick={() => onTabChange('ayam')}
          aria-label="Ayam, Indukan, dan Kandang"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'ayam'
              ? 'text-[#1E6B47] font-bold'
              : 'text-[#4F5B52] hover:text-[#1B2B22]'
          }`}
        >
          <Layers size={22} className={activeTab === 'ayam' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-0.5">Ayam</span>
        </button>

        {/* Tab 3: [ Catat ] (Center Prominent Dedak Pill Button) */}
        <div className="flex-1 flex items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenQuickLog}
            aria-label="Buka Catat Cepat Harian"
            className="h-12 px-4 rounded-full bg-[#F2B632] hover:bg-[#e5a828] text-[#1B2B22] font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all -translate-y-1 border-2 border-white"
          >
            <Plus size={18} className="stroke-[3]" />
            <span>Catat</span>
          </button>
        </div>

        {/* Tab 4: Keuangan */}
        <button
          type="button"
          onClick={() => onTabChange('keuangan')}
          aria-label="Keuangan dan Penjualan"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'keuangan'
              ? 'text-[#1E6B47] font-bold'
              : 'text-[#4F5B52] hover:text-[#1B2B22]'
          }`}
        >
          <DollarSign size={22} className={activeTab === 'keuangan' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-0.5">Keuangan</span>
        </button>

        {/* Tab 5: Asisten AI */}
        <button
          type="button"
          onClick={() => onTabChange('asisten')}
          aria-label="Asisten AI Kandang Pintar"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            activeTab === 'asisten'
              ? 'text-[#1E6B47] font-bold'
              : 'text-[#4F5B52] hover:text-[#1B2B22]'
          }`}
        >
          <MessageSquare size={22} className={activeTab === 'asisten' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-0.5">Asisten</span>
        </button>
      </div>
    </nav>
  );
};
