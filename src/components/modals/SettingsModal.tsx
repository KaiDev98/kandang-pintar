/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Save, RefreshCw, Sparkles, Check, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, updateSettings, resetDemoData, resetToCleanProduction, toggleDemoMode } = useApp();

  const [farmName, setFarmName] = useState<string>(state.settings.farmName);
  const [minSellAgeDays, setMinSellAgeDays] = useState<number>(state.settings.minSellAgeDays);
  const [minSellWeightG, setMinSellWeightG] = useState<number>(state.settings.minSellWeightG);
  const [broodingDays, setBroodingDays] = useState<number>(state.settings.broodingDays);
  const [coopCapacity, setCoopCapacity] = useState<number>(state.settings.coopCapacity);
  const [referencePriceIdr, setReferencePriceIdr] = useState<number>(state.settings.referencePriceIdr);
  const [defaultPurPriceIdr, setDefaultPurPriceIdr] = useState<number>(state.settings.defaultPurPriceIdr);
  const [mortalityAlertPct, setMortalityAlertPct] = useState<number>(state.settings.mortalityAlertPct);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      farmName,
      minSellAgeDays,
      minSellWeightG,
      broodingDays,
      coopCapacity,
      referencePriceIdr,
      defaultPurPriceIdr,
      mortalityAlertPct,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div>
            <h2 id="settings-title" className="text-xl font-extrabold text-[#1B2B22]">
              Pengaturan Peternakan
            </h2>
            <p className="text-xs text-[#4F5B52]">Konfigurasi parameter &amp; data</p>
          </div>
          <button onClick={onClose} aria-label="Tutup pengaturan" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mode Demo Banner */}
          <div className="p-4 bg-[#FFF4D6] rounded-2xl border border-[#F2B632] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A5A00]">
                <Sparkles size={16} /> Mode Data Contoh (Demo)
              </div>
              <p className="text-xs text-[#4F5B52] mt-0.5">
                Mengisi data contoh untuk eksplorasi fitur
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleDemoMode(!state.settings.isDemoMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                state.settings.isDemoMode
                  ? 'bg-[#1E6B47] text-white'
                  : 'bg-white text-[#1B2B22] border border-[#D5DED3]'
              }`}
            >
              {state.settings.isDemoMode ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">Nama Peternakan</label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold text-[#1B2B22]"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1 uppercase tracking-wider">
              Ambang Layak Jual (BR-08)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Target Umur Minimal (Hari)
                </label>
                <input
                  type="number"
                  value={minSellAgeDays}
                  onChange={(e) => setMinSellAgeDays(parseInt(e.target.value) || 90)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Target Bobot Minimal (Gram)
                </label>
                <input
                  type="number"
                  step="50"
                  value={minSellWeightG}
                  onChange={(e) => setMinSellWeightG(parseInt(e.target.value) || 1000)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#1B2B22] border-b border-[#D5DED3] pb-1 uppercase tracking-wider">
              Parameter Biaya &amp; Siklus
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Harga Default Pur (Rp/kg)
                </label>
                <input
                  type="number"
                  step="500"
                  value={defaultPurPriceIdr}
                  onChange={(e) => setDefaultPurPriceIdr(parseInt(e.target.value) || 10000)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Harga Acuan Jual (Rp/ekor)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={referencePriceIdr}
                  onChange={(e) => setReferencePriceIdr(parseInt(e.target.value) || 70000)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Lama Pengeraman (Hari)
                </label>
                <input
                  type="number"
                  value={broodingDays}
                  onChange={(e) => setBroodingDays(parseInt(e.target.value) || 21)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#4F5B52] mb-1">
                  Kapasitas Kandang (Ekor)
                </label>
                <input
                  type="number"
                  value={coopCapacity}
                  onChange={(e) => setCoopCapacity(parseInt(e.target.value) || 25)}
                  className="w-full p-2 border border-[#D5DED3] rounded-xl text-sm num"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#D5DED3] space-y-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bersihkan semua data operasional (batch, pakan, telur, penjualan, biaya) agar siap digunakan oleh klien di tahap produksi?')) {
                  resetToCleanProduction();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl border border-[#B3261E]/40 text-[#B3261E] hover:bg-[#FBE3E0] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 size={14} /> Kosongkan Data (Siap Pakai Klien / Produksi)
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Muat data contoh simulasi peternakan (Batch A, Batch B, 4 indukan)?')) {
                  resetDemoData();
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl border border-[#D5DED3] text-[#4F5B52] hover:bg-[#F1F5EF] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw size={14} /> Muat Data Contoh Simulasi
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check size={18} /> Simpan Pengaturan
          </button>
        </form>
      </div>
    </div>
  );
};
