/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, Check, HeartPulse } from 'lucide-react';

interface AddBirdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBirdModal: React.FC<AddBirdModalProps> = ({ isOpen, onClose }) => {
  const { state, addBird } = useApp();

  const [sex, setSex] = useState<'betina' | 'jantan'>('betina');
  const countSameSex = state.birds.filter((b) => b.sex === sex).length + 1;
  const autoSuggestedCode = `${sex === 'betina' ? 'Betina' : 'Jantan'} ${countSameSex}`;

  const [code, setCode] = useState<string>(autoSuggestedCode);
  const [acquiredOn, setAcquiredOn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weightG, setWeightG] = useState<number>(1800);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSexChange = (newSex: 'betina' | 'jantan') => {
    setSex(newSex);
    const count = state.birds.filter((b) => b.sex === newSex).length + 1;
    setCode(`${newSex === 'betina' ? 'Betina' : 'Jantan'} ${count}`);
    setWeightG(newSex === 'jantan' ? 2200 : 1750);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    addBird({
      code: code.trim(),
      sex,
      acquiredOn,
      weightG: weightG > 0 ? weightG : undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bird-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-[#D5DED3]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D5DED3]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DDF1E3] text-[#14663A] flex items-center justify-center text-lg">
              🐔
            </div>
            <div>
              <h2 id="add-bird-title" className="text-xl font-extrabold text-[#1B2B22]">
                Daftarkan Indukan Baru
              </h2>
              <p className="text-xs text-[#4F5B52]">Ayam dewasa bibit/induk peternakan</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Tutup form" className="p-2 text-[#4F5B52]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Jenis Kelamin Selector */}
          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1.5 uppercase tracking-wider">
              Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSexChange('betina')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  sex === 'betina'
                    ? 'bg-[#1E6B47] text-white border-[#1E6B47] shadow-xs'
                    : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                }`}
              >
                Betina (Induk Bertelur)
              </button>
              <button
                type="button"
                onClick={() => handleSexChange('jantan')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  sex === 'jantan'
                    ? 'bg-[#2F6F9F] text-white border-[#2F6F9F] shadow-xs'
                    : 'bg-[#F1F5EF] text-[#1B2B22] border-[#D5DED3]'
                }`}
              >
                Jantan (Pejantan)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Kode / Nama Indukan
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: Betina 4 / Si Jalu"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-semibold text-[#1B2B22]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Tanggal Masuk</label>
              <input
                type="date"
                value={acquiredOn}
                onChange={(e) => setAcquiredOn(e.target.value)}
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4F5B52] mb-1">Bobot (Gram)</label>
              <input
                type="number"
                step="50"
                value={weightG}
                onChange={(e) => setWeightG(parseInt(e.target.value) || 0)}
                placeholder="gram"
                className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm font-bold num"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4F5B52] mb-1">
              Ciri Fisik / Catatan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Bulu lurik abu, sangat jinak"
              className="w-full p-2.5 border border-[#D5DED3] rounded-xl text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-3.5 bg-[#1E6B47] hover:bg-[#165538] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-40"
          >
            <Check size={18} /> Daftarkan Indukan
          </button>
        </form>
      </div>
    </div>
  );
};
