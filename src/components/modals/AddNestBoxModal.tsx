/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Check, Egg } from 'lucide-react';

interface AddNestBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddNestBoxModal: React.FC<AddNestBoxModalProps> = ({ isOpen, onClose }) => {
  const { state, addNestBox } = useApp();
  const defaultName = `Tempat Eram ${state.nestBoxes.length + 1}`;
  const [name, setName] = useState<string>(defaultName);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addNestBox({ name: name.trim(), note: note.trim() });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-nestbox-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF1E3] text-[#14663A] flex items-center justify-center">
              <Egg size={18} />
            </div>
            <div>
              <h2 id="add-nestbox-title" className="text-xl font-extrabold text-[#1B2B22]">
                Tambah Tempat Pengeraman
              </h2>
              <p className="text-xs text-[#4F5B52]">Tempat bertelur dan mengeram baru</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup form" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Nama Tempat Pengeraman
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Tempat Eram 3"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold text-[#1B2B22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Lokasi / Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Sudut barat kandang 2, jerami baru"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <div className="p-3 bg-[#F1F5EF] rounded-xl border border-[#D5DED3] text-xs text-[#4F5B52] leading-relaxed">
            Satu tempat pengeraman hanya dapat digunakan oleh 1 indukan secara bersamaan (aturan BR-01).
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <Check size={18} /> Simpan Tempat Pengeraman
          </button>
        </form>
      </div>
    </div>
  );
};
