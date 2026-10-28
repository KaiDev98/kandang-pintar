/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Check, Home } from 'lucide-react';

interface AddCoopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCoopModal: React.FC<AddCoopModalProps> = ({ isOpen, onClose }) => {
  const { state, addCoop } = useApp();
  const defaultName = `Kandang ${state.coops.length + 1}`;
  const [name, setName] = useState<string>(defaultName);
  const [capacity, setCapacity] = useState<number>(state.settings.coopCapacity || 25);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCoop({
      name: name.trim(),
      capacity: capacity > 0 ? capacity : 25,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-coop-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF1E3] text-[#14663A] flex items-center justify-center">
              <Home size={18} />
            </div>
            <div>
              <h2 id="add-coop-title" className="text-xl font-extrabold text-[#1B2B22]">
                Tambah Kandang Baru
              </h2>
              <p className="text-xs text-[#4F5B52]">Fasilitas kandang pembesaran / anakan</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup form" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Nama Kandang
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kandang 3 (Pembesaran Luar)"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold text-[#1B2B22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Kapasitas Maksimal (Ekor Ayam)
            </label>
            <input
              type="number"
              min="5"
              max="100"
              required
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 25)}
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-bold num"
            />
            <p className="text-[11px] text-[#4F5B52] mt-1">
              Standar awal adalah 25 ekor (termasuk induk selama masa brooding awal).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Lokasi / Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kandang bambu samping kolam"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <Check size={18} /> Simpan Kandang Baru
          </button>
        </form>
      </div>
    </div>
  );
};
